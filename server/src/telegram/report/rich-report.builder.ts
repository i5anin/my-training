import { Injectable } from '@nestjs/common';
import type {
  InputRichBlock,
  InputRichMessage,
  RichBlockTableCell,
  RichText,
} from 'grammy/types';
import { TelegramConfig } from '../telegram.config';
import type { EmptyDigest, WorkoutDigest } from '../digest/digest.types';
import { emoji, trendKey } from './emoji';

type Block = InputRichBlock;
type Message = InputRichMessage;

/** Число без хвостовых нулей: 11.25 → «11.25», 50 → «50» */
export function fmtKg(value: number): string {
  return String(Number(value.toFixed(2)));
}

/** Колонка «Объём»: вес, если он был, иначе повторы */
export function volumeOf(line: {
  bestWeight: number;
  totalReps: number;
}): string {
  return line.bestWeight > 0
    ? `${fmtKg(line.bestWeight)} кг`
    : `${line.totalReps} повт`;
}

/** Ячейка таблицы: align/valign обязательны по типам Bot API */
function cell(
  text: RichText,
  align: 'left' | 'center' | 'right',
  header = false,
): RichBlockTableCell {
  const base: RichBlockTableCell = { text, align, valign: 'middle' };
  return header ? { ...base, is_header: true } : base;
}

/** Сборка сводки в блочный rich message (Bot API 10.2) */
@Injectable()
export class RichReportBuilder {
  constructor(private readonly config: TelegramConfig) {}

  build(digest: WorkoutDigest): Message {
    const blocks: Block[] = [
      {
        type: 'heading',
        size: 3,
        text: [
          emoji(this.config, 'dumbbell'),
          digest.isFuture ? ' План на ' : ' Тренировка ',
          {
            type: 'date_time',
            text: digest.date,
            unix_time: digest.dateUnix,
            date_time_format: 'wd',
          },
        ],
      },
      {
        type: 'paragraph',
        text: [
          { type: 'bold', text: digest.groups || 'без группы' },
          ` · ${digest.exerciseCount} упр · ${digest.mainSets} раб. подх.`,
          digest.allSets > digest.mainSets ? ` (${digest.allSets} всего)` : '',
        ],
      },
    ];

    if (digest.isDraft) {
      blocks.push({
        type: 'paragraph',
        text: [{ type: 'italic', text: 'Рабочих подходов пока нет.' }],
      });
      return { blocks: [...blocks, this.footer()] };
    }

    blocks.push(
      this.tonnageLine(digest),
      { type: 'divider' },
      this.table(digest),
    );

    const details = this.setsDetails(digest);
    if (details) blocks.push(details);

    if (digest.note) {
      blocks.push({
        type: 'blockquote',
        credit: 'заметка',
        blocks: [{ type: 'paragraph', text: digest.note }],
      });
    }

    blocks.push(this.weekDetails(digest), this.footer());
    return { blocks };
  }

  /** Короткое сообщение для дня без тренировки */
  buildEmpty(digest: EmptyDigest): Message {
    const blocks: Block[] = [
      {
        type: 'heading',
        size: 3,
        text: [emoji(this.config, 'calendar'), ' Сегодня записей нет'],
      },
    ];
    if (digest.lastDate) {
      blocks.push({
        type: 'paragraph',
        text: [
          'Последняя тренировка — ',
          { type: 'bold', text: digest.lastDate },
          digest.gapDays !== null ? ` (${digest.gapDays} дн. назад)` : '',
        ],
      });
    } else {
      blocks.push({ type: 'paragraph', text: 'В журнале пока пусто.' });
    }
    blocks.push(this.footer());
    return { blocks };
  }

  private tonnageLine(digest: WorkoutDigest): Block {
    // Подходы заполнены, а весов нет, хотя снаряд нужен — это план, не работа
    if (digest.plannedOnly) {
      return {
        type: 'paragraph',
        text: [
          emoji(this.config, 'note'),
          ' ',
          { type: 'bold', text: 'Веса не заполнены' },
          ` — план на ${digest.mainSets} подх., ${digest.totalReps} повт.`,
        ],
      };
    }

    // Тренировка целиком со своим весом — тоннаж не показатель, считаем повторы
    if (!digest.hasWeights) {
      return {
        type: 'paragraph',
        text: [
          emoji(this.config, 'core'),
          ' Свой вес · ',
          { type: 'bold', text: `${digest.totalReps} повторов` },
        ],
      };
    }

    const text: RichText[] = [
      emoji(this.config, trendKey(digest.deltaPct)),
      digest.isFuture ? ' Запланировано ' : ' Тоннаж ',
      { type: 'bold', text: `${digest.tonnage} кг` },
    ];
    if (digest.deltaPct !== null && digest.prevDate) {
      const sign = digest.deltaPct > 0 ? '+' : '';
      text.push(
        ' · ',
        { type: 'marked', text: `${sign}${digest.deltaPct}%` },
        ' к ',
        {
          type: 'date_time',
          text: digest.prevDate,
          unix_time: digest.prevDateUnix ?? digest.dateUnix,
          date_time_format: 'd',
        },
      );
    }
    return { type: 'paragraph', text };
  }

  /** Дельты спрятаны под спойлер — сначала вспоминаешь сам, потом открываешь */
  private table(digest: WorkoutDigest): Block {
    const head: RichBlockTableCell[] = [
      cell('Упражнение', 'left', true),
      cell('Подх.', 'center', true),
      cell('Объём', 'right', true),
      cell('Δ', 'right', true),
    ];
    const rows = digest.exercises.map((line) => [
      cell(line.name, 'left'),
      cell(String(line.mainSets), 'center'),
      cell([{ type: 'bold', text: volumeOf(line) }], 'right'),
      cell([{ type: 'spoiler', text: line.delta }], 'right'),
    ]);
    return {
      type: 'table',
      is_bordered: true,
      is_striped: true,
      caption: 'Рабочие подходы',
      cells: [head, ...rows],
    };
  }

  private setsDetails(digest: WorkoutDigest): Block | null {
    const items = digest.exercises
      .filter((line) => line.setsLine || line.warmupLine)
      .map((line) => {
        const text: RichText[] = [
          { type: 'bold', text: line.name },
          ` — ${line.setsLine || '—'}`,
        ];
        if (line.warmupLine)
          text.push({
            type: 'italic',
            text: ` · разминка: ${line.warmupLine}`,
          });
        if (line.note) text.push({ type: 'italic', text: ` · ${line.note}` });
        const blocks: Block[] = [{ type: 'paragraph', text }];
        return { blocks };
      });
    if (items.length === 0) return null;
    return {
      type: 'details',
      summary: [{ type: 'bold', text: 'Подходы по упражнениям' }],
      blocks: [{ type: 'list', items }],
    };
  }

  private weekDetails(digest: WorkoutDigest): Block {
    return {
      type: 'details',
      summary: 'Неделя',
      blocks: [
        {
          type: 'paragraph',
          text: [
            {
              type: 'spoiler',
              text: `${digest.weekTonnage} кг за ${digest.weekCount} трен. за 7 дней`,
            },
          ],
        },
      ],
    };
  }

  private footer(): Block {
    return {
      type: 'footer',
      text: [
        'gym777 · ',
        { type: 'bot_command', text: '/today', bot_command: '/today' },
      ],
    };
  }
}
