import { ref } from 'vue'
import { nanoid } from 'nanoid'
import type { ExerciseEntry, Workout } from '@/types'
import type { Program, ProgramDay, ProgramExercise } from '@/constants/programs'
import { useCatalogStore } from '@/stores/catalogStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import { getNextWorkoutId, saveWorkout } from '@/db'

/** Импорт дней программы в журнал как черновиков тренировок (веса пустые) */
export function useProgramImport() {
  const catalogStore = useCatalogStore()
  const workoutStore = useWorkoutStore()

  const busy = ref(false)
  const status = ref('')

  /** Упражнений программы может не быть в каталоге — создаём перед импортом */
  async function ensureExercises(items: ProgramExercise[]) {
    for (const item of items) {
      if (catalogStore.getExerciseById(item.exerciseId)) continue
      await catalogStore.addExercise({
        id: item.exerciseId,
        name: item.name,
        muscleGroups: item.muscleGroups,
      })
    }
  }

  function toEntries(day: ProgramDay): ExerciseEntry[] {
    const now = new Date().toISOString()
    return day.exercises.map((e) => ({
      id: nanoid(),
      exerciseId: e.exerciseId,
      sets: Array.from({ length: e.sets }, () => ({ reps: e.reps, weight: 0 })),
      description: e.note,
      createdAt: now,
      totalEditMs: 0,
    }))
  }

  function shiftDate(days: number): string {
    const d = new Date()
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  }

  async function createWorkout(program: Program, day: ProgramDay, date: string): Promise<number> {
    await ensureExercises(day.exercises)
    const groups = [day.primaryType, day.secondaryType].filter(Boolean) as string[]
    const workout: Workout = {
      id: await getNextWorkoutId(),
      date,
      muscleGroups: groups,
      primaryType: day.primaryType,
      secondaryType: day.secondaryType ?? '',
      entries: toEntries(day),
      description: `${program.author} — ${day.title}`,
      photoIds: [],
      createdAt: new Date().toISOString(),
      totalEditMs: 0,
    }
    await saveWorkout(workout)
    return workout.id
  }

  /** Один день → тренировка на сегодня; возвращает её id */
  async function importDay(program: Program, day: ProgramDay): Promise<number | null> {
    if (busy.value) return null
    busy.value = true
    status.value = ''
    try {
      const id = await createWorkout(program, day, shiftDate(0))
      await workoutStore.load()
      return id
    } finally {
      busy.value = false
    }
  }

  /** Все дни программы подряд, начиная с сегодня */
  async function importWeek(program: Program) {
    if (busy.value) return
    busy.value = true
    status.value = ''
    try {
      // id выдаёт сервер, поэтому строго последовательно, без Promise.all
      for (const [i, day] of program.days.entries()) {
        await createWorkout(program, day, shiftDate(i))
      }
      await workoutStore.load()
      status.value = `Добавлено тренировок: ${program.days.length}, начиная с ${shiftDate(0)}`
    } finally {
      busy.value = false
    }
  }

  return { busy, status, importDay, importWeek }
}
