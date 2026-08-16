import type { Exercise, ExerciseEntry, SetRow } from '@/types'

/**
 * Формулы нагрузки. Веса в подходах хранятся БЕЗ грифа
 * (как в бумажной тетради), поэтому гриф добавляется здесь.
 */

/** Вес грифа для упражнения: значение из тренировки важнее каталожного */
export function barOf(entry: Pick<ExerciseEntry, 'barWeight'>, exercise?: Exercise): number {
  return entry.barWeight ?? exercise?.barWeight ?? 0
}

/** Полный вес подхода: блины + гриф */
export function totalWeight(set: SetRow, bar: number): number {
  const w = set.weight ?? 0
  // 0 блинов у упражнений со своим весом (турник, брусья) — гриф не при чём
  return w > 0 ? w + bar : 0
}

/** 1ПМ по Эпли: w × (1 + reps/30), при 1 повторе — сам вес */
export function epley(weight: number, reps: number): number {
  if (!weight || !reps) return 0
  return reps === 1 ? weight : weight * (1 + reps / 30)
}

/** Рабочие подходы: без разминочных и добивочных */
export function mainSets(sets: SetRow[] | undefined): SetRow[] {
  return (sets || []).filter((s) => !s.isBurnout && !s.isWarmup)
}

/** Лучший 1ПМ по подходам, кг (округлённый) */
export function best1RM(sets: SetRow[], bar: number): number {
  const values = sets.map((s) => epley(totalWeight(s, bar), s.reps ?? 0))
  return values.length ? Math.round(Math.max(...values)) : 0
}

/** Тоннаж: сумма (вес с грифом × повторы) */
export function tonnage(sets: SetRow[], bar: number): number {
  return sets.reduce((sum, s) => sum + totalWeight(s, bar) * (s.reps ?? 0), 0)
}
