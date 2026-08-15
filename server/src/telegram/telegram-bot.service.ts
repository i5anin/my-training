import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
  Optional,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrammyError, type Bot } from 'grammy';
import type { InlineKeyboardButton, InputRichMessage } from 'grammy/types';
import { BOT } from './bot.factory';
import { TelegramConfig } from './telegram.config';
import { DigestLog } from './digest-log.entity';
import { CardLog } from './technique/card-log.entity';
import { WorkoutDigestService } from './digest/workout-digest.service';
import { RichReportBuilder } from './report/rich-report.builder';
import { FallbackReportBuilder } from './report/fallback-report.builder';
import { TechniqueCardBuilder } from './technique/technique-card.builder';
import { TechniqueRichBuilder } from './technique/technique-rich.builder';
import { digestKeyboard, emptyKeyboard } from './report/keyboard';
import { WorkoutMediaService } from './media/workout-media.service';

type Keyboard = { inline_keyboard: InlineKeyboardButton[][] };

/** Служебный workoutId для сообщения «за день записей нет» */
const EMPTY_DAY = 0;

/** Служебный ключ шпаргалки в журнале карточек */
const SHEET_KEY = '__sheet__';

/** Служебный workoutId стикера-разделителя дня */
const DAY_MARK = -1;

/** Отправка сводок и (при включённом приёме обновлений) обработка команд */
@Injectable()
export class TelegramBotService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TelegramBotService.name);

  constructor(
    @Optional() @Inject(BOT) private readonly bot: Bot | null,
    private readonly config: TelegramConfig,
    private readonly digests: WorkoutDigestService,
    private readonly rich: RichReportBuilder,
    private readonly fallback: FallbackReportBuilder,
    private readonly cards: TechniqueCardBuilder,
    private readonly richCards: TechniqueRichBuilder,
    private readonly media: WorkoutMediaService,
    @InjectRepository(DigestLog)
    private readonly log: Repository<DigestLog>,
    @InjectRepository(CardLog)
    private readonly cardLog: Repository<CardLog>,
  ) {}

  async onModuleInit() {
    if (!this.bot) return;
    if (this.config.updates === 'off') {
      // Режим «только отправка»: getUpdates не вызывается вовсе,
      // поэтому команды и callback-кнопки не обслуживаются
      await this.safeApi('deleteMyCommands', () =>
        this.bot!.api.deleteMyCommands(),
      );
      this.logger.log('Режим только отправки, приём обновлений выключен');
      return;
    }

    this.registerHandlers();
    // Список команд — косметика: недоступность Telegram на старте
    // не должна валить загрузку модуля и весь HTTP-сервер
    await this.safeApi('setMyCommands', () =>
      this.bot!.api.setMyCommands([
        { command: 'today', description: 'Сводка за сегодня' },
        { command: 'last', description: 'Последняя тренировка' },
        { command: 'week', description: 'Итоги 7 дней' },
      ]),
    );
    // Без await, но с catch: 409/401 grammY перебрасывает наружу, и без
    // обработчика необработанный reject завершил бы процесс целиком
    void this.bot
      .start({
        onStart: () => this.logger.log('Long-polling запущен'),
      })
      .catch((error: unknown) => {
        this.pollingDead = true;
        this.logger.error(`polling остановлен: ${this.describe(error)}`);
      });
  }

  async onModuleDestroy() {
    if (!this.bot || this.config.updates !== 'polling' || this.pollingDead) {
      return;
    }
    // stop() ждёт закрытия long-poll; при мёртвой сети это до 500 сек,
    // поэтому завершение ограничено таймаутом
    await Promise.race([
      this.bot.stop(),
      new Promise((resolve) => setTimeout(resolve, 5_000)),
    ]);
  }

  private pollingDead = false;

  /** Плановая отправка: по одной сводке на каждую тренировку даты */
  async sendDailyDigest(
    date: string,
    force = false,
  ): Promise<'sent' | 'updated' | 'skipped'> {
    if (!this.bot) return 'skipped';
    const digests = await this.digests.forDate(date);

    // Разделитель дня — перед любым первым сообщением этой даты
    await this.markNewDay(date);

    if (digests.length === 0) return this.sendEmptyDay(date, force);

    let result: 'sent' | 'updated' | 'skipped' = 'skipped';
    for (const digest of digests) {
      const one = await this.deliver(digest.workoutId, force);
      if (one === 'sent' && result === 'skipped') result = 'sent';
      if (one === 'updated' && result !== 'sent') result = 'updated';
    }

    // Сообщение «записей нет» устарело — убираем его из чата
    await this.dropEmptyDay(date);
    return result;
  }

  private async sendEmptyDay(
    date: string,
    force: boolean,
  ): Promise<'sent' | 'skipped'> {
    if (!this.bot || !this.config.notifyEmptyDay) return 'skipped';
    const existing = await this.log.findOneBy({ date, workoutId: EMPTY_DAY });
    if (existing && !force) return 'skipped';

    const empty = await this.digests.emptyDay(date);
    const keyboard = {
      inline_keyboard: emptyKeyboard(this.config, empty.lastWorkoutId),
    };
    const messageId = await this.send(
      this.rich.buildEmpty(empty),
      this.fallback.buildEmpty(empty),
      keyboard,
      existing?.messageId,
    );
    await this.remember(date, EMPTY_DAY, messageId.id, 'empty');
    return 'sent';
  }

  /** Сводка «записей нет» больше не актуальна: тренировка появилась */
  private async dropEmptyDay(date: string) {
    const stale = await this.log.findOneBy({ date, workoutId: EMPTY_DAY });
    if (!stale || !this.bot) return;
    await this.bot.api
      .deleteMessage(this.config.ownerChatId, stale.messageId)
      .catch(() => undefined);
    await this.log.delete({ date, workoutId: EMPTY_DAY });
  }

  /**
   * Сводка по тренировке. Если сообщение за неё уже отправлено —
   * правится прежнее, а вложения повторно не заливаются.
   */
  private async deliver(
    workoutId: number,
    force = false,
  ): Promise<'sent' | 'updated' | 'skipped'> {
    if (!this.bot) return 'skipped';
    const digest = await this.digests.forId(workoutId);
    if (!digest) {
      this.logger.warn(`тренировка ${workoutId} не найдена`);
      return 'skipped';
    }

    const existing = await this.log.findOneBy({
      date: digest.date,
      workoutId,
    });
    if (existing && !force && existing.variant !== 'failed') return 'skipped';

    const keyboard = {
      inline_keyboard: digestKeyboard(this.config, digest),
    };

    let sent: { id: number; variant: string };
    try {
      sent = await this.send(
        this.rich.build(digest),
        this.fallback.build(digest),
        keyboard,
        existing?.messageId,
      );
    } catch (error) {
      // Отметка о неудаче: иначе catchup будет биться в одну ошибку
      // каждые полчаса и каждый раз заново грузить вложения
      this.logger.error(`сводка ${workoutId}: ${this.describe(error)}`);
      if (this.isPermanent(error)) {
        await this.remember(digest.date, workoutId, 0, 'failed');
      }
      throw error;
    }

    // Вложения — только при первой доставке и после успешного текста
    if (!existing && this.config.sendMedia) {
      await this.sendMedia(digest.photoIds, digest.exercises);
    }

    await this.remember(digest.date, workoutId, sent.id, sent.variant);
    return existing ? 'updated' : 'sent';
  }

  /**
   * Единая отправка: rich, при отказе формата — MarkdownV2.
   * messageId задан → правится существующее сообщение.
   */
  private async send(
    rich: InputRichMessage,
    text: string,
    keyboard: Keyboard,
    messageId?: number,
  ): Promise<{ id: number; variant: string }> {
    const chat = this.config.ownerChatId;

    if (this.config.useRich) {
      try {
        if (messageId) {
          await this.bot!.api.editMessageText(chat, messageId, rich, {
            reply_markup: keyboard,
          });
          return { id: messageId, variant: 'rich' };
        }
        const message = await this.bot!.api.sendRichMessage(chat, rich, {
          reply_markup: keyboard,
        });
        return { id: message.message_id, variant: 'rich' };
      } catch (error) {
        if (this.isNotModified(error)) {
          return { id: messageId!, variant: 'rich' };
        }
        // Откат только на отказ формата. Сеть, 429 и 5xx пробрасываем:
        // повторная отправка того же текста дала бы дубль в чате
        if (!(error instanceof GrammyError) || error.error_code !== 400) {
          throw error;
        }
        this.logger.warn(
          `rich отклонён (${error.description}), шлю MarkdownV2`,
        );
      }
    }

    if (messageId) {
      try {
        await this.bot!.api.editMessageText(chat, messageId, text, {
          parse_mode: 'MarkdownV2',
          reply_markup: keyboard,
        });
        return { id: messageId, variant: 'fallback' };
      } catch (error) {
        if (this.isNotModified(error)) {
          return { id: messageId, variant: 'fallback' };
        }
        if (!this.isMessageGone(error)) throw error;
        this.logger.warn('сообщение для правки исчезло, отправляю новое');
      }
    }

    const message = await this.bot!.api.sendMessage(chat, text, {
      parse_mode: 'MarkdownV2',
      reply_markup: keyboard,
    });
    return { id: message.message_id, variant: 'fallback' };
  }

  /**
   * Стикер-разделитель перед первым сообщением нового дня. Отправляется
   * один раз на дату: факт фиксируется в журнале служебной записью.
   */
  private async markNewDay(date: string) {
    if (!this.bot || !this.config.dayStickerEmoji) return;
    const existing = await this.log.findOneBy({ date, workoutId: DAY_MARK });
    if (existing) return;

    const fileId = await this.dayStickerFileId();
    if (!fileId) return;
    try {
      const message = await this.bot.api.sendSticker(
        this.config.ownerChatId,
        fileId,
      );
      await this.remember(date, DAY_MARK, message.message_id, 'day');
    } catch (error) {
      this.logger.warn(`стикер дня не отправлен: ${this.describe(error)}`);
    }
  }

  /** file_id стикера: из настроек либо поиском по набору, с кешем */
  private async dayStickerFileId(): Promise<string | null> {
    if (this.config.dayStickerId) return this.config.dayStickerId;
    if (this.stickerId) return this.stickerId;
    try {
      const set = await this.bot!.api.getStickerSet(this.config.dayStickerSet);
      const found = set.stickers.find(
        (s) => s.emoji === this.config.dayStickerEmoji,
      );
      this.stickerId = found?.file_id;
      if (!this.stickerId) {
        this.logger.warn(
          `в наборе ${this.config.dayStickerSet} нет ${this.config.dayStickerEmoji}`,
        );
      }
      return this.stickerId ?? null;
    } catch (error) {
      this.logger.warn(`набор стикеров недоступен: ${this.describe(error)}`);
      return null;
    }
  }

  private stickerId?: string;

  /**
   * Отправить тренировку заново: сводка, карточки и шпаргалка приходят
   * новыми сообщениями. Правка на месте не поднимает сообщения в ленте и
   * не даёт уведомления, поэтому для «скинь ещё раз» нужен именно сброс
   * журнала — прежние сообщения остаются в чате как есть.
   */
  async resendWorkout(workoutId: number): Promise<{
    digest: 'sent' | 'updated' | 'skipped';
    cards: number;
    sheet: 'sent' | 'updated' | null;
  }> {
    const digest = await this.digests.forId(workoutId);
    if (!digest) return { digest: 'skipped', cards: 0, sheet: null };

    // Маркер дня не трогаем: стикер уже стоит в ленте выше и не дублируется
    await this.cardLog.delete({ workoutId });
    await this.log.delete({ date: digest.date, workoutId });

    const sent = await this.sendDailyDigest(digest.date, true);
    const cards = await this.sendTechniqueCards(workoutId);
    const sheet = await this.sendCheatSheet(workoutId);
    return { digest: sent, cards: cards.sent, sheet };
  }

  /**
   * Шпаргалка на тренировку одним сообщением. id хранится в CardLog под
   * служебным ключом, поэтому повторный вызов правит её, а не дублирует.
   */
  async sendCheatSheet(workoutId: number): Promise<'sent' | 'updated' | null> {
    if (!this.bot) return null;
    const digest = await this.digests.forId(workoutId);
    if (!digest) return null;

    const rich = this.richCards.cheatSheet(digest);
    const known = await this.cardLog.findOneBy({
      workoutId,
      exerciseId: SHEET_KEY,
    });

    if (known) {
      try {
        await this.bot.api.editMessageText(
          this.config.ownerChatId,
          known.messageId,
          rich,
        );
      } catch (error) {
        // Тот же текст — Telegram отвечает ошибкой, но это не сбой
        if (!this.isNotModified(error)) throw error;
      }
      return 'updated';
    }

    const message = await this.bot.api.sendRichMessage(
      this.config.ownerChatId,
      rich,
    );
    await this.cardLog.save({
      workoutId,
      exerciseId: SHEET_KEY,
      messageId: message.message_id,
      hasPhoto: 0,
      variant: 'rich',
      sentAt: new Date().toISOString(),
    });
    return 'sent';
  }

  /**
   * Анатомические схемы к тренировке — по одной на задействованную группу
   * мышц (фото самих упражнений журнал не хранит). Возвращает число картинок.
   */
  async sendExercisePhotos(workoutId: number): Promise<number> {
    if (!this.bot) return 0;
    const digest = await this.digests.forId(workoutId);
    if (!digest) return 0;

    const items = this.media.groupPhotos(
      digest.exercises.map((line) => ({
        name: line.name,
        muscleGroups: line.muscleGroups,
        scheme: line.scheme,
      })),
    );
    if (items.length === 0) return 0;

    // sendMediaGroup принимает 2-10 элементов; одиночная картинка — sendPhoto
    if (items.length === 1) {
      const only = items[0];
      await this.bot.api.sendPhoto(this.config.ownerChatId, only.media, {
        caption: only.caption,
      });
      return 1;
    }
    await this.bot.api.sendMediaGroup(this.config.ownerChatId, items);
    return items.length;
  }

  /**
   * Карточка техники на каждое упражнение тренировки: фото целевой группы,
   * пояснение к какому дню это относится, порядок выполнения и ошибки.
   * id сообщений пишутся в CardLog, поэтому повторный вызов правит
   * прежние карточки, а не добавляет новые.
   */
  async sendTechniqueCards(
    workoutId: number,
    onlyIds?: string[],
  ): Promise<{ sent: number; edited: number }> {
    if (!this.bot) return { sent: 0, edited: 0 };
    const digest = await this.digests.forId(workoutId);
    if (!digest) return { sent: 0, edited: 0 };

    const lines = onlyIds
      ? digest.exercises.filter((l) => onlyIds.includes(l.exerciseId))
      : digest.exercises;

    await this.markNewDay(digest.date);
    const day = this.dayLabel(digest);
    let sent = 0;
    let edited = 0;

    for (const line of lines) {
      const caption = this.cards.build(line, line.exerciseId, day);
      if (!caption) {
        this.logger.warn(`нет техники для «${line.name}»`);
        continue;
      }
      const known = await this.cardLog.findOneBy({
        workoutId,
        exerciseId: line.exerciseId,
      });
      const found = this.media.forExercise(line.exerciseId, line.muscleGroups);
      const photo = found?.file ?? null;
      const rich = this.config.useRich
        ? this.richCards.build(
            line,
            digest,
            photo ?? undefined,
            found ?? undefined,
          )
        : null;
      const variant = rich ? 'rich' : photo ? 'photo' : 'text';

      try {
        // Правка возможна только в пределах того же типа сообщения:
        // текст блочного сообщения нельзя вставить в подпись к фото
        if (known && known.variant === variant) {
          await this.editCard(known, caption, rich);
          edited += 1;
          continue;
        }

        const message = rich
          ? await this.bot.api.sendRichMessage(this.config.ownerChatId, rich)
          : photo
            ? await this.bot.api.sendPhoto(this.config.ownerChatId, photo, {
                caption,
                parse_mode: 'HTML',
              })
            : await this.bot.api.sendMessage(this.config.ownerChatId, caption, {
                parse_mode: 'HTML',
              });

        await this.cardLog.save({
          workoutId,
          exerciseId: line.exerciseId,
          messageId: message.message_id,
          hasPhoto: photo && !rich ? 1 : 0,
          variant,
          sentAt: new Date().toISOString(),
        });
        sent += 1;
      } catch (error) {
        this.logger.warn(`карточка «${line.name}»: ${this.describe(error)}`);
      }
    }
    return { sent, edited };
  }

  /** Правка прежней карточки; сообщение с фото правится через caption */
  private async editCard(
    card: CardLog,
    caption: string,
    rich: InputRichMessage | null,
  ) {
    const chat = this.config.ownerChatId;
    try {
      if (rich) {
        await this.bot!.api.editMessageText(chat, card.messageId, rich);
      } else if (card.hasPhoto) {
        await this.bot!.api.editMessageCaption(chat, card.messageId, {
          caption,
          parse_mode: 'HTML',
        });
      } else {
        await this.bot!.api.editMessageText(chat, card.messageId, caption, {
          parse_mode: 'HTML',
        });
      }
    } catch (error) {
      if (this.isNotModified(error)) return;
      if (!this.isMessageGone(error)) throw error;
      // Карточку удалили вручную — забываем её, следующий вызов пришлёт новую
      this.logger.warn('карточка исчезла, запись удалена из журнала');
      await this.cardLog.delete({
        workoutId: card.workoutId,
        exerciseId: card.exerciseId,
      });
    }
  }

  /** «План на 14.08, пт · Мой гибрид — День 1, Push» */
  private dayLabel(digest: {
    date: string;
    note: string;
    plannedOnly: boolean;
    isDraft: boolean;
  }): string {
    const [year, month, day] = digest.date.split('-').map(Number);
    const weekday = new Intl.DateTimeFormat('ru-RU', {
      weekday: 'short',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day)));
    const kind =
      digest.plannedOnly || digest.isDraft ? 'План на' : 'Тренировка';
    const head = `${kind} ${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}, ${weekday}`;
    return digest.note ? `${head} · ${digest.note}` : head;
  }

  /** Фото и видео тренировки — альбомом, под спойлером */
  private async sendMedia(
    workoutPhotos: string[],
    exercises: { photoIds: string[] }[],
  ) {
    if (!this.bot) return;
    const ids = [...workoutPhotos, ...exercises.flatMap((e) => e.photoIds)];
    if (ids.length === 0) return;
    const items = this.media.collect(ids, true);
    if (items.length === 0) return;
    try {
      if (items.length === 1) {
        const only = items[0];
        if (only.type === 'video') {
          await this.bot.api.sendVideo(this.config.ownerChatId, only.media, {
            has_spoiler: true,
          });
        } else {
          await this.bot.api.sendPhoto(this.config.ownerChatId, only.media, {
            has_spoiler: true,
          });
        }
        return;
      }
      await this.bot.api.sendMediaGroup(this.config.ownerChatId, items);
    } catch (error) {
      this.logger.warn(`вложения не отправлены: ${this.describe(error)}`);
    }
  }

  private async remember(
    date: string,
    workoutId: number,
    messageId: number,
    variant: string,
  ) {
    await this.log.save({
      date,
      workoutId,
      messageId,
      sentAt: new Date().toISOString(),
      variant,
    });
  }

  private async safeApi(name: string, call: () => Promise<unknown>) {
    try {
      await call();
    } catch (error) {
      this.logger.warn(`${name}: ${this.describe(error)}`);
    }
  }

  private describe(error: unknown): string {
    if (error instanceof GrammyError) {
      return `${error.error_code} ${error.description}`;
    }
    return error instanceof Error ? error.message : String(error);
  }

  /** Правка без изменений — не ошибка */
  private isNotModified(error: unknown): boolean {
    return (
      error instanceof GrammyError &&
      error.description.includes('message is not modified')
    );
  }

  /** Сообщение удалено вручную — правка невозможна, нужна новая отправка */
  private isMessageGone(error: unknown): boolean {
    return (
      error instanceof GrammyError &&
      (error.description.includes('message to edit not found') ||
        error.description.includes("message can't be edited"))
    );
  }

  /** Ошибку содержания повтор не исправит; сеть и 429 — исправит */
  private isPermanent(error: unknown): boolean {
    return error instanceof GrammyError && error.error_code === 400;
  }

  private registerHandlers() {
    const bot = this.bot;
    if (!bot) return;

    bot.catch((error) => this.logger.error(`grammY: ${error.message}`));

    // Бот личный: любой чужой чат молча игнорируется, ответа не получает
    bot.use(async (ctx, next) => {
      const chatId = ctx.chat?.id;
      if (chatId === undefined) return;
      if (String(chatId) !== this.config.ownerChatId) {
        this.logger.warn(`обращение из чужого чата ${chatId} — игнор`);
        return;
      }
      await next();
    });

    bot.command('start', (ctx) => ctx.reply('Сводки тренировок gym777.'));

    bot.command('today', async (ctx) => {
      const date = this.digests.today();
      const digests = await this.digests.forDate(date);
      if (digests.length === 0) {
        await this.sendEmptyDay(date, true);
        return;
      }
      for (const digest of digests) await this.deliver(digest.workoutId, true);
      await ctx.deleteMessage().catch(() => undefined);
    });

    bot.command('last', async (ctx) => {
      const digest = await this.digests.latest();
      if (!digest) {
        await ctx.reply('В журнале пока пусто.');
        return;
      }
      await this.deliver(digest.workoutId, true);
    });

    bot.command('week', async (ctx) => {
      const stats = await this.digests.week(this.digests.today());
      await ctx.reply(
        `За 7 дней: ${stats.count} трен., ${stats.tonnage} кг тоннажа.`,
      );
    });

    bot.on('callback_query:data', async (ctx) => {
      // Подтверждение могло устареть (перезапуск процесса) — это не повод
      // отменять само действие
      await ctx.answerCallbackQuery().catch(() => undefined);
      const [, action, rawId] = ctx.callbackQuery.data.split(':');
      const id = Number(rawId);
      const needsId = action !== 'w';
      if (needsId && !Number.isInteger(id)) {
        this.logger.warn(`callback без id: ${ctx.callbackQuery.data}`);
        return;
      }

      switch (action) {
        case 'p': {
          const digest = await this.digests.forId(id);
          if (!digest) {
            await ctx.reply('Тренировка не найдена.');
            return;
          }
          if (!digest.prevWorkoutId) {
            await ctx.reply('Сравнивать пока не с чем.');
            return;
          }
          await this.deliver(digest.prevWorkoutId, true);
          break;
        }
        case 'w': {
          const stats = await this.digests.week(this.digests.today());
          await ctx.reply(
            `За 7 дней: ${stats.count} трен., ${stats.tonnage} кг тоннажа.`,
          );
          break;
        }
        case 'r':
        case 's': {
          const done = await this.deliver(id, true);
          if (done === 'skipped') await ctx.reply('Тренировка не найдена.');
          break;
        }
        case 'x':
          await ctx.deleteMessage().catch(() => undefined);
          break;
      }
    });
  }
}
