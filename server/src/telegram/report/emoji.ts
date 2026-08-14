import type { RichText } from 'grammy/types';
import { TelegramConfig } from '../telegram.config';

/** Ключи премиум-эмодзи и их обычные аналоги (fallback обязателен по API) */
export const EMOJI_FALLBACK: Record<string, string> = {
  dumbbell: '🏋',
  up: '📈',
  down: '📉',
  flat: '➖',
  fire: '🔥',
  calendar: '📅',
  note: '📝',
  photo: '🖼',
  core: '🧱',
};

/**
 * Премиум-эмодзи как rich-фрагмент. Если id не задан в TELEGRAM_EMOJI_MAP,
 * возвращается обычный символ — сообщение остаётся валидным.
 */
export function emoji(
  config: TelegramConfig,
  key: keyof typeof EMOJI_FALLBACK,
): RichText {
  const fallback = EMOJI_FALLBACK[key] ?? '•';
  const id = config.emojiMap[key];
  if (!id) return fallback;
  return {
    type: 'custom_emoji',
    custom_emoji_id: id,
    alternative_text: fallback,
  };
}

/** Значок направления по знаку дельты */
export function trendKey(deltaPct: number | null): keyof typeof EMOJI_FALLBACK {
  if (deltaPct === null || deltaPct === 0) return 'flat';
  return deltaPct > 0 ? 'up' : 'down';
}
