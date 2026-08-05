import { computed } from 'vue'
import { useWorkoutStore } from '@/stores/workoutStore'

// Карты использования: сколько раз упражнение / группа мышц встречаются в тренировках
export function useCatalogUsage() {
  const workoutStore = useWorkoutStore()

  const exerciseUsage = computed(() => {
    const m = new Map<string, number>()
    for (const w of workoutStore.workouts) {
      for (const e of (w.entries || [])) {
        m.set(e.exerciseId, (m.get(e.exerciseId) ?? 0) + 1)
      }
    }
    return m
  })

  const groupUsage = computed(() => {
    const m = new Map<string, number>()
    for (const w of workoutStore.workouts) {
      for (const id of (w.muscleGroups || [])) {
        m.set(id, (m.get(id) ?? 0) + 1)
      }
    }
    return m
  })

  return { exerciseUsage, groupUsage }
}
