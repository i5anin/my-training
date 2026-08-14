import { Logger } from '@nestjs/common';
import { Bot } from 'grammy';
import { TelegramConfig } from './telegram.config';

export const BOT = Symbol('TELEGRAM_BOT');

/**
 * Фабрика бота. Соединение прямое: api.telegram.org открывается через
 * системный туннель. Если понадобится своя прослойка — TELEGRAM_API_ROOT.
 */
export function createBot(config: TelegramConfig): Bot | null {
  const logger = new Logger('TelegramBot');
  if (!config.enabled) {
    logger.warn(
      'Бот выключен: нет TELEGRAM_BOT_TOKEN или TELEGRAM_OWNER_CHAT_ID',
    );
    return null;
  }

  if (config.apiRoot) logger.log(`Bot API root: ${config.apiRoot}`);

  return new Bot(config.token, {
    client: config.apiRoot ? { apiRoot: config.apiRoot } : {},
  });
}
