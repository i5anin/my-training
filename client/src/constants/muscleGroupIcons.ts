export const MUSCLE_GROUP_ICONS: Record<string, string> = {
  chest:       '🏋️',
  back:        '🦴',
  lats:        '🦴',
  traps:       '🦴',
  'lower-back':'🦴',
  shoulders:   '🤷',
  'rear-delts':'🤷',
  arms:        '💪',
  biceps:      '💪',
  triceps:     '💪',
  forearms:    '💪',
  legs:        '🦵',
  quadriceps:  '🦵',
  hamstrings:  '🦵',
  glutes:      '🍑',
  икры:        '🦵',
  core:        '⭕',
  obliques:    '⭕',
  cardio:      '🏃',
}

export const MUSCLE_GROUP_IMAGES: Record<string, string> = {
  chest:       '/icons/chest.png',
  back:        '/icons/back.png',
  lats:        '/icons/back.png',
  traps:       '/icons/traps.avif',
  'lower-back':'/icons/back.png',
  shoulders:   '/icons/shoulders.png',
  'front-delts':'/icons/shoulders.png',
  'side-delts':'/icons/shoulders.png',
  'rear-delts':'/icons/shoulders.png',
  arms:        '/icons/arms.png',
  biceps:      '/icons/arms.png',
  triceps:     '/icons/arms.png',
  forearms:    '/icons/arms.png',
  legs:        '/icons/legs.png',
  quadriceps:  '/icons/legs.png',
  hamstrings:  '/icons/legs.png',
  glutes:      '/icons/legs.png',
  икры:        '/icons/икры.png',
  core:        '/icons/core.png',
  obliques:    '/icons/obliques.jpg',
}

export function getMuscleGroupIcon(id: string): string {
  return MUSCLE_GROUP_ICONS[id] ?? '🏋️'
}

export function getMuscleGroupImage(id: string): string | null {
  return MUSCLE_GROUP_IMAGES[id] ?? null
}

/**
 * Буква-бейдж на строку упражнения — одна буква (или две при коллизии
 * первых букв) на семью групп мышц, от русского названия (label в
 * каталоге), а не от английского id. «Плечи»/«Пресс» оба начинаются
 * на «П» — разведены на «Пл»/«Пр». «Бицепс»/«Трицепс» разведены от
 * общего «Р» (Руки) на свои буквы. «Кардио» — двубуквенное «Кд»
 * (коллизия с «Косые»/«Квадрицепс»).
 */
export const MUSCLE_GROUP_LETTERS: Record<string, string> = {
  chest: 'Г', // Грудь
  back: 'С', lats: 'С', traps: 'С', 'lower-back': 'С', // Спина
  // Кружок — на семью мышц: какая именно дельта, видно в подписи рядом
  shoulders: 'Пл', 'front-delts': 'Пл', 'side-delts': 'Пл', 'rear-delts': 'Пл',
  arms: 'Р', forearms: 'Р', // Руки (общее, без уточнения головки)
  biceps: 'Б', // Бицепс
  triceps: 'Т', // Трицепс
  legs: 'Н', quadriceps: 'Н', hamstrings: 'Н', glutes: 'Н', // Ноги
  икры: 'И', // Икры
  core: 'Пр', obliques: 'Пр', // Пресс / Косые
  cardio: 'Кд', // Кардио
  stretching: 'Рс', // Растяжка
}

/** Приглушённый акцентный цвет на семью — узнаваемый оттенок, без крикливой яркости */
export const MUSCLE_GROUP_COLORS: Record<string, string> = {
  chest: '#c97b76',
  back: '#7ba3d9', lats: '#7ba3d9', traps: '#7ba3d9', 'lower-back': '#7ba3d9',
  shoulders: '#cbb676',
  'front-delts': '#cbb676', 'side-delts': '#cbb676', 'rear-delts': '#cbb676',
  arms: '#76c98f', forearms: '#76c98f',
  biceps: '#c9945a',
  triceps: '#8a8ac9',
  legs: '#a67bc9', quadriceps: '#a67bc9', hamstrings: '#a67bc9',
  glutes: '#a67bc9', икры: '#a67bc9',
  core: '#c976a6', obliques: '#c976a6',
  cardio: '#76c9c4',
  stretching: '#a3c976',
}

export function getMuscleGroupLetter(id: string): string {
  return MUSCLE_GROUP_LETTERS[id] ?? '?'
}

export function getMuscleGroupColor(id: string): string {
  return MUSCLE_GROUP_COLORS[id] ?? '#888'
}

/**
 * Цвет бейджа по уровню нагрузки: красный — мышца активная, жёлтый —
 * работает слабо (ассистент или стабилизатор). Перекрывает цвет семьи
 * там, где важна не группа, а её вклад в упражнение.
 */
export const INVOLVEMENT_COLORS = {
  primary: '#d4635c',
  secondary: '#d1a343',
} as const

export type Involvement = keyof typeof INVOLVEMENT_COLORS

export const INVOLVEMENT_LABELS: Record<Involvement, string> = {
  primary: 'активная',
  secondary: 'слабо активная',
}

/**
 * Группы без совпадающих букв: внутри семьи (спина, ноги) буква общая,
 * и два одинаковых круга рядом читаются хуже одного. Полный состав
 * остаётся в подсказке.
 */
export function distinctByLetter(ids: string[], taken = new Set<string>()): string[] {
  const result: string[] = []

  for (const id of ids) {
    const letter = getMuscleGroupLetter(id)
    if (taken.has(letter)) continue
    taken.add(letter)
    result.push(id)
  }

  return result
}

/** Слабые мышцы без тех, чья буква уже занята основными */
export function distinctSecondary(primary: string[], secondary: string[]): string[] {
  return distinctByLetter(secondary, new Set(primary.map(getMuscleGroupLetter)))
}

/**
 * Обобщённые группы: годятся для фильтра и буквы-бейджа, но не для
 * подписи «какие мышцы работают» — там нужны конкретные.
 */
export const GENERIC_GROUPS = new Set(['back', 'legs', 'shoulders', 'arms'])

export function detailedOnly(ids: string[]): string[] {
  return ids.filter((id) => !GENERIC_GROUPS.has(id))
}

/**
 * Основные группы — семьи мышц. У них есть узнаваемая буква, поэтому в
 * фильтрах они показываются кружком; детальные группы (широчайшие,
 * трапеция, дельты по пучкам) буквой не различить — им нужна надпись.
 */
export const FAMILY_GROUPS = new Set([
  'chest', 'back', 'shoulders', 'arms', 'legs', 'core', 'cardio', 'stretching',
])

export function isFamilyGroup(id: string): boolean {
  return FAMILY_GROUPS.has(id)
}

/** Детальные группы внутри семьи — для дерева в справочнике */
export const FAMILY_CHILDREN: Record<string, string[]> = {
  chest: [],
  back: ['lats', 'traps', 'lower-back'],
  shoulders: ['front-delts', 'side-delts', 'rear-delts'],
  arms: ['biceps', 'triceps', 'forearms'],
  legs: ['quadriceps', 'hamstrings', 'glutes', 'икры'],
  core: ['obliques'],
  cardio: [],
  stretching: [],
}
