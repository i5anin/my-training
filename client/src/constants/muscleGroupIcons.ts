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

/** Буква-бейдж на строку упражнения: одна буква на семью групп мышц */
export const MUSCLE_GROUP_LETTERS: Record<string, string> = {
  chest: 'Г',
  back: 'С', lats: 'С', traps: 'С', 'lower-back': 'С',
  shoulders: 'П', 'rear-delts': 'П',
  arms: 'Р', biceps: 'Р', triceps: 'Р', forearms: 'Р',
  legs: 'Н', quadriceps: 'Н', hamstrings: 'Н',
  glutes: 'Н', икры: 'Н',
  core: 'К', obliques: 'К',
  cardio: 'Д',
}

/** Насыщенный акцентный цвет на ту же семью — не бледный, узнаваемый на тёмном фоне */
export const MUSCLE_GROUP_COLORS: Record<string, string> = {
  chest: '#e8524a',
  back: '#4a8fe8', lats: '#4a8fe8', traps: '#4a8fe8', 'lower-back': '#4a8fe8',
  shoulders: '#e8c34a', 'rear-delts': '#e8c34a',
  arms: '#4ae87a', biceps: '#4ae87a', triceps: '#4ae87a', forearms: '#4ae87a',
  legs: '#a24ae8', quadriceps: '#a24ae8', hamstrings: '#a24ae8',
  glutes: '#a24ae8', икры: '#a24ae8',
  core: '#e84aa2', obliques: '#e84aa2',
  cardio: '#4ae8e0',
}

export function getMuscleGroupLetter(id: string): string {
  return MUSCLE_GROUP_LETTERS[id] ?? '?'
}

export function getMuscleGroupColor(id: string): string {
  return MUSCLE_GROUP_COLORS[id] ?? '#888'
}
