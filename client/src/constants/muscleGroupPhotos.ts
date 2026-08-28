// Filename → URL helper
function mgPhoto(name: string) {
  return `/api/mg-photo?name=${encodeURIComponent(name)}`
}

/**
 * Фото групп мышц. Файлы лежат в data/photos и отдаются через
 * /api/mg-photo — имена и расширения должны совпадать с каталогом
 * буквально, иначе ссылка отдаёт 404. Детальные группы ведут на фото
 * своей семьи; для спины, рук и икр фото пока нет.
 */
export const MUSCLE_GROUP_PHOTO: Record<string, string> = {
  chest: mgPhoto('грудь.jpg'),
  shoulders: mgPhoto('плечи.jpg'),
  'front-delts': mgPhoto('плечи.jpg'),
  'side-delts': mgPhoto('плечи.jpg'),
  'rear-delts': mgPhoto('плечи.jpg'),
  traps: mgPhoto('шраги.avif'),
  legs: mgPhoto('ноги.jpg'),
  quadriceps: mgPhoto('ноги.jpg'),
  hamstrings: mgPhoto('ноги.jpg'),
  glutes: mgPhoto('ноги.jpg'),
  core: mgPhoto('пресс.avif'),
  obliques: mgPhoto('косые пресс.jpg'),
}

export function getMuscleGroupPhoto(id: string): string | null {
  return MUSCLE_GROUP_PHOTO[id] ?? null
}
