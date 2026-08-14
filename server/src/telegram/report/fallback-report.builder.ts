import { Injectable } from '@nestjs/common';
import type { EmptyDigest, WorkoutDigest } from '../digest/digest.types';
import { EMOJI_FALLBACK } from './emoji';
import { volumeOf } from './rich-report.builder';

/** Символы, требующие экранирования в MarkdownV2 */
const SPECIAL = /[_*[\]()~`>#+\-=|{}.!\\]/g;

/** Лимит текста сообщения в Bot API */
const MAX_LEN = 4096;

function esc(text: string): string {
  return text.replace(SPECIAL, (ch) => `\\${ch}`);
}

/**
 * Раскрываемая цитата в MarkdownV2: каждая строка начинается с «>»,
 * первая — с «**», последняя закрывается «||». Однострочная сборка
 * ломалась на заметках с переводом строки.
 */
function quote(text: string): string {
  const rows = text.split(/\r?\n/).map((row) => `>${esc(row)}`);
  return `**${rows.join('\n')}||`;
}

/**
 * Резервный вид сообщения на MarkdownV2 — если sendRichMessage
 * отклонён или rich-режим выключен.
 */
@Injectable()
export class FallbackReportBuilder {
  build(digest: WorkoutDigest): string {
    const lines: string[] = [
      `${EMOJI_FALLBACK.dumbbell} *Тренировка ${esc(digest.date)}*`,
      `${esc(digest.groups || 'без группы')} · ${digest.exerciseCount} упр · ${digest.mainSets} раб\\. подх\\.`,
    ];

    if (digest.isDraft) {
      lines.push('', '_Рабочих подходов пока нет\\._');
      return this.clamp(lines);
    }

    lines.push(this.volumeLine(digest), '');

    for (const line of digest.exercises) {
      lines.push(
        `• *${esc(line.name)}* — ${esc(line.setsLine || '—')} · ${esc(volumeOf(line))} · ||${esc(line.delta)}||`,
      );
      if (line.warmupLine) lines.push(`  _разминка: ${esc(line.warmupLine)}_`);
      if (line.note) lines.push(`  _${esc(line.note)}_`);
    }

    if (digest.note) lines.push('', quote(digest.note));
    lines.push(
      '',
      `Неделя: ||${digest.weekTonnage} кг за ${digest.weekCount} трен\\.||`,
    );
    return this.clamp(lines);
  }

  buildEmpty(digest: EmptyDigest): string {
    const lines = [`${EMOJI_FALLBACK.calendar} *Сегодня записей нет*`];
    if (digest.lastDate) {
      const gap =
        digest.gapDays !== null ? ` \\(${digest.gapDays} дн\\. назад\\)` : '';
      lines.push(`Последняя тренировка — *${esc(digest.lastDate)}*${gap}`);
    } else {
      lines.push('В журнале пока пусто\\.');
    }
    return lines.join('\n');
  }

  private volumeLine(digest: WorkoutDigest): string {
    if (digest.plannedOnly) {
      return `${EMOJI_FALLBACK.note} *Веса не заполнены* — план на ${digest.mainSets} подх\\., ${digest.totalReps} повт\\.`;
    }
    if (!digest.hasWeights) {
      return `Свой вес · *${digest.totalReps} повторов*`;
    }
    const delta =
      digest.deltaPct !== null && digest.prevDate
        ? ` · ${esc((digest.deltaPct > 0 ? '+' : '') + digest.deltaPct + '%')} к ${esc(digest.prevDate)}`
        : '';
    return `Тоннаж *${digest.tonnage} кг*${delta}`;
  }

  /**
   * Урезание по лимиту: строки отбрасываются целиком, иначе обрыв
   * посреди сущности даёт 400 «Can't find end of entity».
   */
  private clamp(lines: string[]): string {
    let text = lines.join('\n');
    if (text.length <= MAX_LEN) return text;
    const kept: string[] = [];
    let length = 0;
    const tail = '\n_…сводка урезана по лимиту Telegram_';
    for (const line of lines) {
      if (length + line.length + 1 + tail.length > MAX_LEN) break;
      kept.push(line);
      length += line.length + 1;
    }
    text = kept.join('\n') + tail;
    return text;
  }
}
