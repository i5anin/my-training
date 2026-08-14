/**
 * Формулы нагрузки — серверная копия client/src/composables/strength.ts.
 * Веса подходов хранятся БЕЗ грифа, поэтому гриф добавляется здесь.
 */

export interface SetLike {
  weight?: number;
  reps?: number;
  isBurnout?: boolean;
  isWarmup?: boolean;
}

/** Вес грифа: значение из записи важнее каталожного */
export function barOf(
  entryBar?: number | null,
  exerciseBar?: number | null,
): number {
  return entryBar ?? exerciseBar ?? 0;
}

/** Полный вес подхода: блины + гриф; свой вес (0 блинов) остаётся нулём */
export function totalWeight(set: SetLike, bar: number): number {
  const w = set.weight ?? 0;
  return w > 0 ? w + bar : 0;
}

/** 1ПМ по Эпли */
export function epley(weight: number, reps: number): number {
  if (!weight || !reps) return 0;
  return reps === 1 ? weight : weight * (1 + reps / 30);
}

/** Рабочие подходы: без разминочных и добивочных */
export function mainSets(sets: SetLike[] | undefined): SetLike[] {
  return (sets || []).filter((s) => !s.isBurnout && !s.isWarmup);
}

/** Лучший 1ПМ по подходам, кг (округляется — это оценка, не измерение) */
export function best1RM(sets: SetLike[], bar: number): number {
  const values = sets.map((s) => epley(totalWeight(s, bar), s.reps ?? 0));
  return values.length ? Math.round(Math.max(...values)) : 0;
}

/**
 * Лучший рабочий вес подхода, кг. Без округления: в журнале есть
 * четвертькилограммовые веса (11.25, 41.75), и Math.round их искажал.
 * Подходы с нулевыми повторами не учитываются — вес не был поднят.
 */
export function bestWeight(sets: SetLike[], bar: number): number {
  const values = sets
    .filter((s) => (s.reps ?? 0) > 0)
    .map((s) => totalWeight(s, bar));
  return values.length ? Math.max(...values) : 0;
}

/** Тоннаж: сумма (вес с грифом × повторы) */
export function tonnage(sets: SetLike[], bar: number): number {
  return sets.reduce((sum, s) => sum + totalWeight(s, bar) * (s.reps ?? 0), 0);
}
