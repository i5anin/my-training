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
 * Буква-бейдж на строку упражнения — одна буква на семью групп мышц,
 * от русского названия (label в каталоге), а не от английского id.
 * «Пресс» и «Плечи» обе тянутся к «П» — Пресс/Косые обозначены как «Ж»
 * (живот), это устоявшийся термин. «Кардио» тоже претендовало на «К»
 * вместе с «Косые»/«Квадрицепс» — оставлено двубуквенным «Кд».
 */
export const MUSCLE_GROUP_LETTERS: Record<string, string> = {
  chest: 'Г', // Грудь
  back: 'С', lats: 'С', traps: 'С', 'lower-back': 'С', // Спина
  shoulders: 'П', 'rear-delts': 'П', // Плечи
  arms: 'Р', biceps: 'Р', triceps: 'Р', forearms: 'Р', // Руки
  legs: 'Н', quadriceps: 'Н', hamstrings: 'Н', // Ноги
  glutes: 'Н', икры: 'Н',
  core: 'Ж', obliques: 'Ж', // Пресс / Косые
  cardio: 'Кд', // Кардио
}

/** Приглушённый акцентный цвет на семью — узнаваемый оттенок, без крикливой яркости */
export const MUSCLE_GROUP_COLORS: Record<string, string> = {
  chest: '#c97b76',
  back: '#7ba3d9', lats: '#7ba3d9', traps: '#7ba3d9', 'lower-back': '#7ba3d9',
  shoulders: '#cbb676',
  'rear-delts': '#cbb676',
  arms: '#76c98f', biceps: '#76c98f', triceps: '#76c98f', forearms: '#76c98f',
  legs: '#a67bc9', quadriceps: '#a67bc9', hamstrings: '#a67bc9',
  glutes: '#a67bc9', икры: '#a67bc9',
  core: '#c976a6', obliques: '#c976a6',
  cardio: '#76c9c4',
}

export function getMuscleGroupLetter(id: string): string {
  return MUSCLE_GROUP_LETTERS[id] ?? '?'
}

export function getMuscleGroupColor(id: string): string {
  return MUSCLE_GROUP_COLORS[id] ?? '#888'
}
