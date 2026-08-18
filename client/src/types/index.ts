export interface MuscleGroup {
  id: string
  label: string
}

export interface Exercise {
  id: string
  name: string
  muscleGroups: string[]
  /** Вес грифа по умолчанию, кг — учитывается в статистике */
  barWeight?: number | null
}

export interface SetRow {
  reps: number
  weight: number
  isBurnout?: boolean
  isWarmup?: boolean
  /** Субъективная оценка тяжести подхода: легко / нормально / тяжело */
  difficulty?: 'easy' | 'normal' | 'hard'
}

export interface ExerciseEntry {
  id: string
  exerciseId: string
  sets: SetRow[]
  supersetGroupId?: string
  description?: string
  photoIds?: string[]
  barWeight?: number
  createdAt?: string
  totalEditMs?: number
}

export interface Workout {
  id: number
  date: string
  muscleGroups: string[]
  entries: ExerciseEntry[]
  description?: string
  photoIds?: string[]
  primaryType?: string
  secondaryType?: string
  createdAt?: string
  totalEditMs?: number
}

export interface PhotoRecord {
  id: string
  blob: Blob
  thumbnail: Blob
  createdAt: string
}

export interface UserSettings {
  key: string
  value: string
}
