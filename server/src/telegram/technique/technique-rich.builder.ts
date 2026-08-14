import { Injectable } from '@nestjs/common';
import type { InputFile } from 'grammy';
import type { InputRichBlock, InputRichMessage, RichText } from 'grammy/types';
import type { ExerciseLine, WorkoutDigest } from '../digest/digest.types';
import { TelegramConfig } from '../telegram.config';
import { emoji } from '../report/emoji';
import { techniqueOf, type Technique } from './exercise-technique';

type Block = InputRichBlock;

/**
 * Карточка упражнения блоками Bot API 10.2: фото группы мышц, параметры,
 * техника и ошибки списками. Лимит 32768 символов против 1024 у подписи
 * к фото, поэтому техника влезает целиком.
 *
 * Блоки table и details здесь намеренно не используются: клиент владельца
 * рисует вместо таблицы заглушку «Таблица», а сворачиваемый блок оставляет
 * один заголовок без содержимого.
 */
@Injectable()
export class TechniqueRichBuilder {
  constructor(private readonly config: TelegramConfig) {}

  /** null — техники для упражнения нет в справочнике */
  build(
    line: ExerciseLine,
    digest: WorkoutDigest,
    photo?: InputFile | string,
  ): InputRichMessage | null {
    const technique = techniqueOf(line.exerciseId);
    if (!technique) return null;

    const blocks: Block[] = [
      {
        type: 'heading',
        size: 3,
        text: [this.icon(technique), ' ', line.name],
      },
      {
        type: 'paragraph',
        // Текст даты пишем читаемым сами: клиент, не понимающий date_time,
        // показывает именно поле text, и «2026-08-14» выглядело сырым
        text: [
          digest.plannedOnly || digest.isDraft || digest.isFuture
            ? 'План на '
            : 'Тренировка ',
          {
            type: 'date_time',
            text: this.humanDate(digest.date),
            unix_time: digest.dateUnix,
            date_time_format: 'wd',
          },
          digest.note ? ` · ${digest.note}` : '',
        ],
      },
    ];

    // Локальный файл grammY сериализует в multipart сам — проверено
    // отправкой: блок принимает и InputFile, и file_id
    if (photo) {
      blocks.push({
        type: 'photo',
        photo: { type: 'photo', media: photo },
        caption: { text: 'Целевые мышцы' },
      });
    }

    blocks.push(this.paramsLine(line, technique));

    // Плоские списки вместо details: сворачиваемый блок и чекбоксы
    // на клиенте показали только заголовок, текст оставался скрытым
    blocks.push(...this.section('Настройка снаряда', technique.setup, 'note'));
    blocks.push(...this.section('Исходное положение', technique.start, 'note'));
    blocks.push(...this.section('Выполнение', technique.steps, 'note'));
    blocks.push(
      ...this.lines([
        ['Дыхание', technique.breathing],
        ['Ощущение', technique.feel],
        ['Разминка', technique.warmup],
      ]),
    );
    blocks.push(...this.section('Ошибки', technique.mistakes, 'fire'));
    blocks.push(
      ...this.lines([
        ['Верный вес', technique.check],
        ['Прогрессия', technique.progression],
      ]),
    );

    if (technique.spine) {
      // Без credit: клиент печатает его отдельной строкой «спина» под цитатой
      blocks.push({
        type: 'blockquote',
        blocks: [
          {
            type: 'paragraph',
            text: [{ type: 'bold', text: 'Спина: ' }, technique.spine],
          },
        ],
      });
    }

    blocks.push({
      type: 'footer',
      text: [
        'gym777 · ',
        { type: 'spoiler', text: `в прошлый раз: ${line.delta}` },
      ],
    });

    return { blocks };
  }

  /**
   * Шпаргалка на тренировку: один короткий список «упражнение — подходы»,
   * чтобы в зале не листать карточки. Веса уже с грифом.
   */
  cheatSheet(digest: WorkoutDigest): InputRichMessage {
    const blocks: Block[] = [
      {
        type: 'heading',
        size: 3,
        text: [
          emoji(this.config, 'dumbbell'),
          digest.isFuture ? ' План на ' : ' Тренировка ',
          this.humanDate(digest.date),
        ],
      },
      {
        type: 'list',
        items: digest.exercises.map((line) => ({
          blocks: [
            {
              type: 'paragraph',
              text: [
                { type: 'bold', text: line.name },
                ` — ${line.setsLine || '—'}`,
              ],
            },
          ],
        })),
      },
      {
        type: 'paragraph',
        text: [
          `${digest.mainSets} подх · ${digest.totalReps} повт · `,
          { type: 'bold', text: `${digest.tonnage} кг` },
        ],
      },
    ];
    if (digest.note) {
      blocks.push({
        type: 'blockquote',
        blocks: [{ type: 'paragraph', text: digest.note }],
      });
    }
    return { blocks };
  }

  /**
   * Параметры строкой, а не таблицей: клиент без поддержки блока table
   * рисует вместо неё заглушку «Таблица» и данные теряются.
   */
  private paramsLine(line: ExerciseLine, technique: Technique): Block {
    return {
      type: 'paragraph',
      text: [
        { type: 'bold', text: line.scheme },
        ` · темп ${technique.tempo} · отдых ${technique.rest}`,
      ],
    };
  }

  /** «14.08, пт» — то, что увидит клиент без поддержки date_time */
  private humanDate(iso: string): string {
    const [year, month, day] = iso.split('-').map(Number);
    const weekday = new Intl.DateTimeFormat('ru-RU', {
      weekday: 'short',
      timeZone: 'UTC',
    }).format(new Date(Date.UTC(year, month - 1, day)));
    return `${String(day).padStart(2, '0')}.${String(month).padStart(2, '0')}, ${weekday}`;
  }

  /** Однострочные пункты «Заголовок: значение» */
  private lines(pairs: [string, string][]): Block[] {
    return pairs.map(([title, value]) => ({
      type: 'paragraph',
      text: [{ type: 'bold', text: `${title}: ` }, value],
    }));
  }

  /** Раздел: подзаголовок и плоский список — виден без раскрытия */
  private section(
    title: string,
    items: string[],
    mark: 'note' | 'fire',
  ): Block[] {
    return [
      {
        type: 'heading',
        size: 5,
        text: [emoji(this.config, mark), ' ', { type: 'bold', text: title }],
      },
      {
        type: 'list',
        items: items.map((text) => ({
          blocks: [{ type: 'paragraph', text }],
        })),
      },
    ];
  }

  /**
   * Значок упражнения: премиум-эмодзи из TELEGRAM_EMOJI_MAP, если карта
   * заполнена, иначе обычный символ из справочника техники.
   */
  private icon(technique: Technique): RichText {
    const id = this.config.emojiMap['dumbbell'];
    if (!id) return technique.icon;
    return {
      type: 'custom_emoji',
      custom_emoji_id: id,
      alternative_text: technique.icon,
    };
  }
}
