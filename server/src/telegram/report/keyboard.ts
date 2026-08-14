import type { InlineKeyboardButton } from 'grammy/types';
import { TelegramConfig } from '../telegram.config';

/**
 * Цвет кнопки — поле style, Bot API 10.1. Допустимы ровно три значения:
 * danger (красная), success (зелёная), primary (синяя).
 */
type Style = 'danger' | 'success' | 'primary';

function callback(
  text: string,
  data: string,
  style?: Style,
): InlineKeyboardButton {
  return style
    ? { text, callback_data: data, style }
    : { text, callback_data: data };
}

/**
 * Telegram принимает в кнопке только публичный http(s)-адрес: localhost
 * и приватные диапазоны отклоняются с «Wrong HTTP URL».
 */
function isPublicHttpUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
  const host = url.hostname;
  if (host === 'localhost' || host.endsWith('.local')) return false;
  if (/^(127|10)\./.test(host)) return false;
  if (/^192\.168\./.test(host)) return false;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
  return true;
}

/** Кнопка-ссылка на приложение; null — адрес локальный, Telegram его не примет */
function appButton(
  config: TelegramConfig,
  path: string,
): InlineKeyboardButton | null {
  if (!config.appUrl) return null;
  const url = `${config.appUrl}/#${path}`;
  if (!isPublicHttpUrl(url)) return null;
  return { text: 'Открыть в приложении', url, style: 'primary' };
}

/**
 * Клавиатура сводки. callback_data — до 64 байт, отсюда короткие префиксы.
 * При выключенном приёме обновлений callback-кнопки не рисуются: нажатие
 * такой кнопки осталось бы без ответа.
 */
export function digestKeyboard(
  config: TelegramConfig,
  digest: { workoutId: number; prevWorkoutId: number | null },
): InlineKeyboardButton[][] {
  const { workoutId, prevWorkoutId } = digest;
  const rows: InlineKeyboardButton[][] = [];
  if (config.updates === 'polling') {
    const first: InlineKeyboardButton[] = [];
    // Кнопки нет, если сравнивать не с чем — нажатие было бы пустым
    if (prevWorkoutId) {
      first.push(callback('Прошлый раз', `d:p:${workoutId}`, 'primary'));
    }
    first.push(callback('Неделя', 'd:w', 'primary'));
    rows.push(first, [
      callback('Пересчитать', `d:r:${workoutId}`, 'success'),
      callback('Свернуть', `d:x:${workoutId}`, 'danger'),
    ]);
  }
  const link = appButton(config, `/workout/${workoutId}`);
  if (link) rows.push([link]);
  return rows;
}

/** Клавиатура для дня без тренировки */
export function emptyKeyboard(
  config: TelegramConfig,
  lastWorkoutId: number | null,
): InlineKeyboardButton[][] {
  const rows: InlineKeyboardButton[][] = [];
  if (lastWorkoutId && config.updates === 'polling') {
    rows.push([
      callback('Показать последнюю', `d:s:${lastWorkoutId}`, 'primary'),
    ]);
  }
  const link = appButton(config, '/workout/new');
  if (link) rows.push([link]);
  return rows;
}
