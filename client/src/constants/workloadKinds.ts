/**
 * Вид нагрузки — не мышца. В базе маркеры лежат в том же справочнике,
 * что и группы мышц (`cardio`, `stretching`), потому что так исторически
 * помечались упражнения. Интерфейс разводит их: вид показывается
 * отдельной меткой, в чипах мышц маркеры не появляются.
 */
export type WorkloadKindId = 'strength' | 'cardio' | 'stretching'

export interface WorkloadKind {
  id: WorkloadKindId
  label: string
  color: string
}

export const WORKLOAD_KINDS: Record<WorkloadKindId, WorkloadKind> = {
  strength: { id: 'strength', label: 'Силовое', color: '#7bb0d9' },
  cardio: { id: 'cardio', label: 'Кардио', color: '#76c9c4' },
  stretching: { id: 'stretching', label: 'Растяжка', color: '#a3c976' },
}

/** Группы-маркеры вида: в списках мышц они не показываются */
export const KIND_MARKERS: Record<string, WorkloadKindId> = {
  cardio: 'cardio',
  stretching: 'stretching',
}

interface KindSource {
  muscleGroups: string[]
  secondaryMuscleGroups?: string[] | null
}

/** Вид упражнения по маркерам; без маркера упражнение силовое */
export function kindOf(exercise: KindSource | null | undefined): WorkloadKind {
  for (const id of exercise?.muscleGroups ?? []) {
    const kind = KIND_MARKERS[id]
    if (kind) return WORKLOAD_KINDS[kind]
  }
  return WORKLOAD_KINDS.strength
}

/** Группы мышц без маркеров вида */
export function musclesOnly(ids: string[]): string[] {
  return ids.filter((id) => !KIND_MARKERS[id])
}

/** Виды нагрузки, встречающиеся в наборе групп — для шапки тренировки */
export function kindsIn(ids: string[]): WorkloadKind[] {
  const found = ids.map((id) => KIND_MARKERS[id]).filter(Boolean) as WorkloadKindId[]
  return [...new Set(found)].map((id) => WORKLOAD_KINDS[id])
}
