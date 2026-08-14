import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { TelegramConfig } from './telegram.config';
import { TelegramBotService } from './telegram-bot.service';
import { WorkoutDigestService } from './digest/workout-digest.service';

/**
 * Расписание сводок. Задания создаются вручную, а не декоратором Cron:
 * выражения приходят из .env и в декоратор их не передать.
 */
@Injectable()
export class DigestScheduler implements OnModuleInit {
  private readonly logger = new Logger(DigestScheduler.name);
  /** Защита от наложения: два задания не шлют сводку одновременно */
  private running = false;

  constructor(
    private readonly registry: SchedulerRegistry,
    private readonly config: TelegramConfig,
    private readonly bot: TelegramBotService,
    private readonly digests: WorkoutDigestService,
  ) {}

  onModuleInit() {
    if (!this.config.enabled) return;
    this.add('digest.evening', this.config.digestCron);
    this.add('digest.catchup', this.config.catchupCron);
  }

  private add(name: string, expression: string) {
    if (!expression.trim()) return;
    try {
      const job = new CronJob(
        expression,
        () => void this.run(name),
        null,
        false,
        this.config.timeZone,
      );
      this.registry.addCronJob(name, job);
      job.start();
      this.logger.log(`${name}: ${expression} (${this.config.timeZone})`);
    } catch (error) {
      // Опечатка в выражении или зоне не должна ронять весь сервер:
      // журнал тренировок и ручная отправка остаются работоспособными
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`${name} не создано (${expression}): ${reason}`);
    }
  }

  private async run(name: string) {
    if (this.running) {
      this.logger.warn(`${name}: предыдущая отправка ещё идёт, пропуск`);
      return;
    }
    this.running = true;
    try {
      const result = await this.bot.sendDailyDigest(this.digests.today());
      if (result !== 'skipped') this.logger.log(`${name}: сводка ${result}`);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`${name}: ${reason}`);
    } finally {
      this.running = false;
    }
  }
}
