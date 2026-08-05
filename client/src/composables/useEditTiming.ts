import type { Ref } from 'vue'
import type { Workout } from '@/types'

const MAX_SESSION_MS = 5 * 60 * 1000

// Учёт времени редактирования: сессия тренировки целиком
// и пер-упражнение (для бейджа в ExerciseEntryCard).
// Интервалы короче 2 сек не засчитываются, длиннее 5 мин — обрезаются.
export function useEditTiming(workout: Ref<Workout>) {
  let workoutSessionStart = 0

  function startWorkoutSession() {
    workoutSessionStart = Date.now()
  }

  function finalizeWorkoutTime() {
    if (!workoutSessionStart) return
    const elapsed = Math.min(Date.now() - workoutSessionStart, MAX_SESSION_MS)
    if (elapsed >= 2000) {
      workout.value.totalEditMs = (workout.value.totalEditMs ?? 0) + elapsed
    }
    workoutSessionStart = Date.now()
  }

  const entrySessionStarts = new Map<string, number>()

  function startEntrySession(id: string) {
    entrySessionStarts.set(id, Date.now())
  }

  function finalizeEntryTimes() {
    const now = Date.now()
    workout.value.entries = workout.value.entries.map((entry) => {
      const start = entrySessionStarts.get(entry.id)
      if (start == null) return entry
      const elapsed = Math.min(now - start, MAX_SESSION_MS)
      if (elapsed < 2000) return entry
      return { ...entry, totalEditMs: (entry.totalEditMs ?? 0) + elapsed }
    })
    workout.value.entries.forEach((e) => startEntrySession(e.id))
  }

  return {
    startWorkoutSession,
    finalizeWorkoutTime,
    startEntrySession,
    finalizeEntryTimes,
  }
}
