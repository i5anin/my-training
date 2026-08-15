import { Injectable, Logger } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { InputFile } from 'grammy';
import type { InputMediaPhoto, InputMediaVideo } from 'grammy/types';

const PHOTO_EXT = ['jpg', 'jpeg', 'png', 'avif', 'webp'];
const VIDEO_EXT = ['mp4', 'mov', 'webm'];

/**
 * Анатомические картинки групп мышц — те же файлы, что показывает клиент
 * (client/src/constants/muscleGroupPhotos.ts). Фото самих упражнений
 * в журнале не хранятся, поэтому к упражнению прикладывается его группа.
 */
const GROUP_PHOTO: Record<string, string> = {
  chest: 'грудь.jpg',
  shoulders: 'плечи.jpg',
  legs: 'ноги.jpg',
  core: 'пресс.avif',
  // Файлов ниже в каталоге пока нет; появятся — подхватятся сами,
  // отсутствие проверяется через existsSync
  arms: 'руки.jpg',
  triceps: 'трицепс.jpg',
  biceps: 'бицепс.jpg',
  back: 'спина.jpg',
  lats: 'спина.jpg',
  traps: 'шраги.avif',
  obliques: 'косые пресс.jpg',
  glutes: 'ягодицы.jpg',
  hamstrings: 'ноги.jpg',
  quadriceps: 'ноги.jpg',
  'rear-delts': 'плечи.jpg',
  'lower-back': 'спина.jpg',
};

export type WorkoutMedia = InputMediaPhoto | InputMediaVideo;

/**
 * Файлы вложений тренировки. Клиент сохраняет фото как <id>.jpg,
 * но поиск ведётся по всем известным расширениям — на случай, когда
 * в каталоге окажется png или видео.
 */
@Injectable()
export class WorkoutMediaService {
  private readonly logger = new Logger(WorkoutMediaService.name);
  private readonly dir = join(process.cwd(), '..', 'data', 'photos');

  /** До 10 вложений — предел sendMediaGroup */
  collect(ids: string[], spoiler: boolean): WorkoutMedia[] {
    const out: WorkoutMedia[] = [];
    for (const id of ids.slice(0, 10)) {
      const found = this.resolve(id);
      if (!found) {
        this.logger.warn(`вложение ${id} не найдено в ${this.dir}`);
        continue;
      }
      const file = new InputFile(
        readFileSync(found.path),
        `${id}.${found.ext}`,
      );
      const isVideo = VIDEO_EXT.includes(found.ext);
      out.push(
        isVideo
          ? { type: 'video', media: file, has_spoiler: spoiler || undefined }
          : { type: 'photo', media: file, has_spoiler: spoiler || undefined },
      );
    }
    return out;
  }

  /**
   * Одна картинка на группу мышц, а не на упражнение: в журнале лежат
   * анатомические схемы групп, поэтому шесть упражнений груди и плеч
   * дали бы шесть почти одинаковых снимков. В подписи — упражнения,
   * которые к этой группе относятся.
   */
  groupPhotos(
    exercises: { name: string; muscleGroups: string[]; scheme: string }[],
  ): WorkoutMedia[] {
    const byGroup = new Map<string, string[]>();
    for (const exercise of exercises) {
      const group = exercise.muscleGroups.find((g) => GROUP_PHOTO[g]);
      if (!group) {
        this.logger.warn(`нет картинки группы для «${exercise.name}»`);
        continue;
      }
      const list = byGroup.get(group) ?? [];
      list.push(`${exercise.name} — ${exercise.scheme}`);
      byGroup.set(group, list);
    }

    const out: WorkoutMedia[] = [];
    for (const [group, lines] of byGroup) {
      const file = GROUP_PHOTO[group];
      const path = join(this.dir, file);
      if (!existsSync(path)) continue;
      out.push({
        type: 'photo',
        media: new InputFile(readFileSync(path), file),
        caption: lines.join('\n'),
      });
    }
    return out.slice(0, 10);
  }

  /**
   * Медиа упражнения: сначала персональный файл `ex-<id>.(jpg|mp4|…)`
   * в каталоге вложений, иначе анатомическая схема целевой группы.
   */
  forExercise(
    exerciseId: string,
    muscleGroups: string[],
  ): { file: InputFile; kind: 'photo' | 'video' } | null {
    const own = this.resolve(`ex-${exerciseId}`);
    if (own) {
      return {
        file: new InputFile(
          readFileSync(own.path),
          `ex-${exerciseId}.${own.ext}`,
        ),
        kind: VIDEO_EXT.includes(own.ext) ? 'video' : 'photo',
      };
    }
    const group = this.photoForGroups(muscleGroups);
    return group ? { file: group, kind: 'photo' } : null;
  }

  /** Картинка целевой группы упражнения; null — для этой группы файла нет */
  photoForGroups(muscleGroups: string[]): InputFile | null {
    const group = muscleGroups.find((g) => GROUP_PHOTO[g]);
    if (!group) return null;
    const file = GROUP_PHOTO[group];
    const path = join(this.dir, file);
    if (!existsSync(path)) return null;
    return new InputFile(readFileSync(path), file);
  }

  private resolve(id: string): { path: string; ext: string } | null {
    // Идентификатор приходит из БД, но путь всё равно нормализуем:
    // файл обязан лежать в каталоге вложений и никуда не подниматься
    const safe = id.replace(/[^A-Za-z0-9_-]/g, '');
    if (!safe) return null;
    for (const ext of [...PHOTO_EXT, ...VIDEO_EXT]) {
      const path = join(this.dir, `${safe}.${ext}`);
      if (existsSync(path)) return { path, ext };
    }
    return null;
  }
}
