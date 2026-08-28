/**
 * Готовые программы тренировок известных атлетов + личный гибрид.
 * Данные — реконструкция по публичным интервью и разборам, не официальные
 * планы. Упражнения ссылаются на id каталога; отсутствующие в каталоге
 * создаются при импорте (см. ProgramsView.ensureExercises).
 */

export interface ProgramExercise {
  /** id упражнения в каталоге */
  exerciseId: string
  /** Название — используется, если упражнения ещё нет в каталоге */
  name: string
  muscleGroups: string[]
  sets: number
  /** Целевые повторы; для времени — секунды, пояснение в note */
  reps: number
  note?: string
}

export interface ProgramDay {
  id: string
  title: string
  /** id группы мышц для primaryType тренировки */
  primaryType: string
  secondaryType?: string
  exercises: ProgramExercise[]
  /** Пояснение к дню целиком: чем наполняется, где искать состав */
  note?: string
}

export interface Program {
  id: string
  author: string
  title: string
  subtitle: string
  daysPerWeek: number
  split: string
  level: 'новичок' | 'средний' | 'продвинутый'
  goal: string
  /** false — есть осевая нагрузка на позвоночник (присед, становая, жим стоя) */
  spineSafe: boolean
  /** Уточнение к плашке о позвоночнике; без него берётся текст по умолчанию */
  spineNote?: string
  source?: string
  notes: string[]
  days: ProgramDay[]
}
