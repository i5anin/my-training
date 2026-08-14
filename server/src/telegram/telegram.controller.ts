import { BadRequestException, Controller, Post, Query } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { TelegramBotService } from './telegram-bot.service';
import { WorkoutDigestService } from './digest/workout-digest.service';
import { TelegramConfig } from './telegram.config';

/** Событие сохранения тренировки — эмитит WorkoutsService */
export const WORKOUT_SAVED = 'workout.saved';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Пауза перед отправкой после сохранения. Редактор автосохраняет
 * каждые 30 секунд, поэтому события собираются в одно.
 */
const DEBOUNCE_MS = 90_000;

@Controller('telegram')
export class TelegramController {
  constructor(
    private readonly bot: TelegramBotService,
    private readonly digests: WorkoutDigestService,
    private readonly config: TelegramConfig,
  ) {}

  /** Ручная отправка — для проверки настроек; дата по умолчанию сегодняшняя */
  @Post('digest')
  async digest(@Query('date') date?: string) {
    if (date && !DATE_RE.test(date)) {
      throw new BadRequestException('date: ожидается YYYY-MM-DD');
    }
    const target = date || this.digests.today();
    const result = await this.bot.sendDailyDigest(target, true);
    return { date: target, result, enabled: this.config.enabled };
  }

  /**
   * Тренировка сохранена. Сводка уходит только по записи за сегодня и
   * с задержкой: пока идёт правка, автосохранения сливаются в одну отправку.
   */
  @OnEvent(WORKOUT_SAVED)
  onWorkoutSaved(payload: { date?: string }) {
    if (!this.config.enabled) return;
    const today = this.digests.today();
    if (payload?.date !== today) return;

    if (this.pending) clearTimeout(this.pending);
    this.pending = setTimeout(() => {
      this.pending = undefined;
      void this.bot.sendDailyDigest(today, true);
    }, DEBOUNCE_MS);
  }

  private pending?: ReturnType<typeof setTimeout>;
}
