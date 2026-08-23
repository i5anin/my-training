import type { Workout } from '@/types'

export function suggestExercises(
  exerciseIds: string[],
  selectedMuscleGroups: string[],
  allExercises: {
    id: string
    name: string
    muscleGroups: string[]
    secondaryMuscleGroups?: string[] | null
  }[],
  allWorkouts: Workout[],
  query: string,
): string[] {
  const freq = new Map<string, number>()
  for (const w of allWorkouts) {
    for (const e of w.entries) {
      freq.set(e.exerciseId, (freq.get(e.exerciseId) || 0) + 1)
    }
  }

  // Совпадение по мышцам дня: 2 — активная, 1 — работает слабо, 0 — нет
  const matchRank = (e: { muscleGroups: string[]; secondaryMuscleGroups?: string[] | null }) => {
    if (selectedMuscleGroups.length === 0) return 0
    if (e.muscleGroups.some((mg) => selectedMuscleGroups.includes(mg))) return 2
    if ((e.secondaryMuscleGroups ?? []).some((mg) => selectedMuscleGroups.includes(mg))) return 1
    return 0
  }

  let candidates = allExercises
  if (selectedMuscleGroups.length > 0) {
    candidates = [...allExercises].sort((a, b) => matchRank(b) - matchRank(a))
  }

  if (query) {
    const q = query.toLowerCase()
    candidates = candidates.filter((e) => e.name.toLowerCase().includes(q))
  }

  candidates.sort((a, b) => {
    const rankDiff = matchRank(b) - matchRank(a)
    if (rankDiff !== 0) return rankDiff
    return (freq.get(b.id) || 0) - (freq.get(a.id) || 0)
  })

  return candidates.map((e) => e.id)
}

export function suggestReps(exerciseId: string, allWorkouts: Workout[]): number[] {
  const freq = new Map<number, number>()
  for (const w of allWorkouts) {
    for (const entry of w.entries) {
      if (entry.exerciseId === exerciseId) {
        for (const s of entry.sets) {
          freq.set(s.reps, (freq.get(s.reps) || 0) + 1)
        }
      }
    }
  }

  if (freq.size === 0) return [12, 15, 20, 10, 8]

  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([reps]) => reps)
}

export function suggestWeight(exerciseId: string, allWorkouts: Workout[]): { last: number; max: number; all: number[] } {
  let last = 0
  let max = 0
  let lastWorkoutId = -1
  const freq = new Map<number, number>()

  for (const w of allWorkouts) {
    for (const entry of w.entries) {
      if (entry.exerciseId === exerciseId) {
        for (const s of entry.sets) {
          if (s.weight > 0) {
            freq.set(s.weight, (freq.get(s.weight) || 0) + 1)
          }
          if (s.weight > max) max = s.weight
          if (w.id > lastWorkoutId) {
            lastWorkoutId = w.id
            last = s.weight
          }
        }
      }
    }
  }

  const all = [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([w]) => w)

  return { last, max, all }
}
