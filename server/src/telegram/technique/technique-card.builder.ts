import { Injectable } from '@nestjs/common';
import type { ExerciseLine } from '../digest/digest.types';
import { TelegramConfig } from '../telegram.config';
import { techniqueOf, type Technique } from './exercise-technique';

/** Лимит подписи к фото в Bot API */
const CAPTION_LIMIT = 1024;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Карточка упражнения: подпись к фото в HTML. Премиум-эмодзи ставятся
 * тегом tg-emoji, если id заданы в TELEGRAM_EMOJI_MAP; иначе остаются
 * обычные символы — Telegram подменяет их сам, если бот не имеет права
 * на кастомные эмодзи.
 */
@Injectable()
export class TechniqueCardBuilder {
  constructor(private readonly config: TelegramConfig) {}

  /**
   * Подпись карточки. `day` — пояснение, к какой тренировке относится
   * карточка: без него в чате не видно, план это на завтра или разбор
   * прошлой недели.
   */
  build(line: ExerciseLine, exerciseId: string, day: string): string | null {
    const technique = techniqueOf(exerciseId);
    if (!technique) return null;

    const head = `${this.icon(technique)} <b>${escapeHtml(line.name)}</b> — ${escapeHtml(line.scheme)}`;
    const meta = `<i>темп ${escapeHtml(technique.tempo)} · отдых ${escapeHtml(technique.rest)}</i>`;

    const blocks = [
      `<i>${escapeHtml(day)}</i>`,
      head,
      meta,
      '',
      '<b>Как делать</b>',
    ];
    blocks.push(...technique.cues.map((c) => `• ${escapeHtml(c)}`));

    const withMistakes = [...blocks, '', '<b>Ошибки</b>'];
    withMistakes.push(...technique.mistakes.map((m) => `• ${escapeHtml(m)}`));

    const withSpine = technique.spine
      ? [
          ...withMistakes,
          '',
          `<blockquote>🦴 ${escapeHtml(technique.spine)}</blockquote>`,
        ]
      : withMistakes;

    // Ошибки и заметка по спине отбрасываются, если подпись не влезает
    for (const variant of [withSpine, withMistakes, blocks]) {
      const text = variant.join('\n');
      if (text.length <= CAPTION_LIMIT) return text;
    }
    return blocks.join('\n').slice(0, CAPTION_LIMIT);
  }

  private icon(technique: Technique): string {
    const id = this.config.emojiMap['dumbbell'];
    if (!id) return technique.icon;
    return `<tg-emoji emoji-id="${id}">${technique.icon}</tg-emoji>`;
  }
}
