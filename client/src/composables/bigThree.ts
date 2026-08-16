/**
 * Базовая тройка: жим лёжа, приседания, становая тяга.
 * Выделяются золотой рамкой во всех списках и таблицах.
 */
export const BIG_THREE_IDS = new Set([
  'bench-press',           // Жим лёжа
  'incline-bench-press',   // Жим лёжа наклонный
  'squat',                 // Приседания
  'hack-squat',            // Гакк-приседания
  'deadlift',              // Становая тяга
  'становая-тяга-сумо',    // Становая тяга сумо
  'romanian-deadlift',     // Румынская тяга
])

export function isBigThree(exerciseId: string | undefined): boolean {
  return !!exerciseId && BIG_THREE_IDS.has(exerciseId)
}
