import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Настройки телеграм-бота. Секреты только из .env — токен и chat_id
 * в код не попадают. Без токена модуль поднимается в выключенном виде.
 */
@Injectable()
export class TelegramConfig {
  private readonly logger = new Logger(TelegramConfig.name);

  readonly token: string;
  readonly ownerChatId: string;
  readonly apiRoot: string;
  /**
   * off — бот только отправляет (никакого getUpdates), команды и
   * callback-кнопки не работают; polling — приём обновлений включён.
   */
  readonly updates: 'off' | 'polling';
  readonly timeZone: string;
  readonly digestCron: string;
  readonly catchupCron: string;
  readonly notifyEmptyDay: boolean;
  readonly useRich: boolean;
  readonly sendMedia: boolean;
  readonly appUrl: string;
  readonly emojiMap: Record<string, string>;

  constructor(config: ConfigService) {
    this.token = config.get<string>('TELEGRAM_BOT_TOKEN', '').trim();
    this.ownerChatId = config.get<string>('TELEGRAM_OWNER_CHAT_ID', '').trim();
    this.apiRoot = config.get<string>('TELEGRAM_API_ROOT', '').trim();
    this.updates =
      config.get<string>('TELEGRAM_UPDATES', 'off') === 'polling'
        ? 'polling'
        : 'off';
    this.timeZone = config.get<string>('TELEGRAM_TZ', 'Europe/Moscow');
    this.digestCron = config.get<string>('TELEGRAM_DIGEST_CRON', '0 21 * * *');
    // Диапазон до 20 часов: с '*/30 18-23' догоняющее задание совпадало
    // с вечерним в 21:00:00 и сводка уходила дважды
    this.catchupCron = config.get<string>(
      'TELEGRAM_CATCHUP_CRON',
      '*/30 18-20 * * *',
    );
    this.notifyEmptyDay =
      config.get<string>('TELEGRAM_EMPTY_DAY', 'silent') === 'notify';
    this.useRich = config.get<string>('TELEGRAM_RICH', 'true') !== 'false';
    this.sendMedia = config.get<string>('TELEGRAM_MEDIA', 'true') !== 'false';
    this.appUrl = config.get<string>('TELEGRAM_APP_URL', '').trim();
    this.emojiMap = this.parseEmojiMap(
      config.get<string>('TELEGRAM_EMOJI_MAP', ''),
    );
  }

  /** Бот включён, только если задан токен и чат владельца */
  get enabled(): boolean {
    const flag = process.env.TELEGRAM_ENABLED !== 'false';
    return flag && Boolean(this.token) && Boolean(this.ownerChatId);
  }

  /**
   * Премиум-эмодзи требуют id из конкретного набора и работают лишь у
   * ботов с Premium-владельцем. Пустая карта — обычные эмодзи в тексте.
   */
  private parseEmojiMap(raw: string): Record<string, string> {
    if (!raw.trim()) return {};
    try {
      const parsed: unknown = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};
      const out: Record<string, string> = {};
      for (const [key, value] of Object.entries(
        parsed as Record<string, unknown>,
      )) {
        if (typeof value === 'string' && value.trim()) out[key] = value.trim();
      }
      return out;
    } catch {
      this.logger.warn(
        'TELEGRAM_EMOJI_MAP — не валидный JSON, премиум-эмодзи выключены',
      );
      return {};
    }
  }
}
