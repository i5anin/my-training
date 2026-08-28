/**
 * Паттерн движения: толкающее, тянущее, приседание, шарнир, корсет.
 * Ось независимая от вида нагрузки и от мышц — по ней видно, как день
 * сбалансирован: сколько толчка против тяги.
 */
export type PatternId = 'push' | 'pull' | 'squat' | 'hinge' | 'core' | 'cardio'

export interface MovementPattern {
  id: PatternId
  label: string
  color: string
}

export const PATTERNS: Record<PatternId, MovementPattern> = {
  push: { id: 'push', label: 'толкающее', color: '#8fa9d9' },
  pull: { id: 'pull', label: 'тянущее', color: '#9ed98f' },
  squat: { id: 'squat', label: 'приседание', color: '#d9a88f' },
  hinge: { id: 'hinge', label: 'шарнир', color: '#c98fd9' },
  core: { id: 'core', label: 'корсет', color: '#d9d18f' },
  cardio: { id: 'cardio', label: 'кардио', color: '#8fd9d4' },
}

/** Упражнения, которые правило по мышцам определяет неверно */
const EXPLICIT: Record<string, PatternId> = {
  hyperextension: 'hinge',
  'glute-bridge': 'hinge',
  'hip-thrust': 'hinge',
  'romanian-deadlift': 'hinge',
  deadlift: 'hinge',
  'становая-тяга-сумо': 'hinge',
  'leg-press': 'squat',
  'hack-squat': 'squat',
  'leg-extension': 'squat',
  'разгибание-сидя-сайбокс': 'squat',
  'leg-curl': 'hinge',
  'сгибание-сидя-сайбокс': 'hinge',
  'сгибание-бедра-тренажер-сидя': 'hinge',
  'calf-raise': 'squat',
  'икры-на-платформе': 'squat',
  'икры-стоя-импульс': 'squat',
  'сидя-игры': 'squat',
  'неразборчиво-19': 'squat',
  'приведение-бедра-тренажер': 'hinge',
  shrugs: 'pull',
  'трапеция-шраги': 'pull',
  'скручивание-штанги-предплечья': 'pull',
  plank: 'core',
  'pallof-press': 'core',
  'ab-wheel': 'core',
}

/** Группы, по которым паттерн определяется, в порядке приоритета */
const BY_MUSCLE: [string, PatternId][] = [
  ['cardio', 'cardio'],
  ['stretching', 'core'],
  ['core', 'core'],
  ['obliques', 'core'],
  ['lats', 'pull'],
  ['back', 'pull'],
  ['traps', 'pull'],
  ['lower-back', 'hinge'],
  ['biceps', 'pull'],
  ['rear-delts', 'pull'],
  ['forearms', 'pull'],
  ['chest', 'push'],
  ['front-delts', 'push'],
  ['side-delts', 'push'],
  ['shoulders', 'push'],
  ['triceps', 'push'],
  ['quadriceps', 'squat'],
  ['glutes', 'hinge'],
  ['hamstrings', 'hinge'],
  ['икры', 'squat'],
  ['legs', 'squat'],
]

export function patternOf(
  exercise: { id: string; muscleGroups: string[] } | null | undefined,
): MovementPattern | null {
  if (!exercise) return null

  const explicit = EXPLICIT[exercise.id]
  if (explicit) return PATTERNS[explicit]

  for (const [muscle, pattern] of BY_MUSCLE) {
    if (exercise.muscleGroups.includes(muscle)) return PATTERNS[pattern]
  }
  return null
}
