/**
 * Снимки техники по упражнениям. Кладутся в client/public/exercises/
 * под именем id упражнения. Если снимка нет — миниатюра показывает
 * анатомическую схему ведущей группы мышц, как раньше.
 *
 * Список явный, а не «пробуем угадать путь»: иначе каталог из
 * 95 упражнений сыпал бы 404 на каждый отсутствующий файл.
 */
export interface ExercisePhoto {
  src: string
  /** Кадр горизонтальный — миниатюра и превью шире, чем схема мышц */
  landscape?: boolean
}

export const EXERCISE_PHOTOS: Record<string, ExercisePhoto> = {
  'pallof-press': { src: '/exercises/pallof-press.webp', landscape: true },
  'cable-row': { src: '/exercises/cable-row.webp', landscape: true },
  'chest-supported-row': { src: '/exercises/chest-supported-row.webp', landscape: true },
  'lat-pulldown': { src: '/exercises/lat-pulldown.webp', landscape: true },
}

export function getExercisePhoto(id: string | undefined): ExercisePhoto | null {
  if (!id) return null
  return EXERCISE_PHOTOS[id] ?? null
}
