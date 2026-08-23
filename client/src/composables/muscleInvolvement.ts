import { useCatalogStore } from '@/stores/catalogStore'
import { distinctSecondary } from '@/constants/muscleGroupIcons'
import type { Exercise } from '@/types'

/**
 * Уровни нагрузки упражнения: активные мышцы (`muscleGroups`) и
 * работающие слабо — ассистенты и стабилизаторы.
 */
export function useMuscleInvolvement() {
  const catalogStore = useCatalogStore()

  const weakOf = (ex: Exercise): string[] => ex.secondaryMuscleGroups ?? []

  /** Бейджи слабых мышц: без тех, чья буква уже занята активными */
  const weakBadges = (ex: Exercise): string[] => distinctSecondary(ex.muscleGroups, weakOf(ex))

  const labelOf = (id: string): string =>
    catalogStore.muscleGroups.find((m) => m.id === id)?.label ?? id

  /** Полный состав по уровням — для подсказки, где бейджи схлопнуты */
  function hint(ex: Exercise): string {
    const active = ex.muscleGroups.map(labelOf).join(', ')
    const weak = weakOf(ex).map(labelOf).join(', ')
    return weak ? `Активные: ${active} · Слабо: ${weak}` : `Активные: ${active}`
  }

  return { weakOf, weakBadges, labelOf, hint }
}

/**
 * Следующий уровень группы мышц по кругу: не работает → активная →
 * слабо активная → не работает. `null` — активная группа последняя,
 * снять её нельзя.
 */
export function cycleInvolvement(ex: Exercise, mgId: string) {
  const active = ex.muscleGroups
  const weak = ex.secondaryMuscleGroups ?? []

  if (active.includes(mgId)) {
    if (active.length === 1) return null
    return {
      muscleGroups: active.filter((m) => m !== mgId),
      secondaryMuscleGroups: [...weak, mgId],
    }
  }

  if (weak.includes(mgId)) {
    return { muscleGroups: active, secondaryMuscleGroups: weak.filter((m) => m !== mgId) }
  }

  return { muscleGroups: [...active, mgId], secondaryMuscleGroups: weak }
}
