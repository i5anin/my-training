import type { Workout, Exercise, MuscleGroup, User } from '@/types'

const API = '/api'

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, init)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`)
  return res.json()
}

function post(url: string, body: unknown) {
  return json(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// Init — no-op, server seeds data on startup
export async function initDB() {}

// Workouts
export async function getAllWorkouts(): Promise<Workout[]> {
  return json('/workouts')
}

export async function getWorkout(id: number): Promise<Workout | undefined> {
  const result = await json<Workout | null>(`/workouts/${id}`)
  return result ?? undefined
}

export async function getNextWorkoutId(): Promise<number> {
  const { id } = await json<{ id: number }>('/workouts/next-id')
  return id
}

export async function saveWorkout(workout: Workout): Promise<void> {
  await post('/workouts', workout)
}

export async function deleteWorkout(id: number): Promise<void> {
  await json(`/workouts/${id}`, { method: 'DELETE' })
}

// Exercises
export async function getAllExercises(): Promise<Exercise[]> {
  return json('/exercises')
}

export async function saveExercise(exercise: Exercise): Promise<void> {
  await post('/exercises', exercise)
}

export async function deleteExercise(id: string): Promise<void> {
  await json(`/exercises/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// Muscle Groups
export async function getAllMuscleGroups(): Promise<MuscleGroup[]> {
  return json('/muscle-groups')
}

export async function saveMuscleGroup(group: MuscleGroup): Promise<void> {
  await post('/muscle-groups', group)
}

export async function deleteMuscleGroup(id: string): Promise<void> {
  await json(`/muscle-groups/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

// Users
export async function getAllUsers(): Promise<User[]> {
  return json('/users')
}

export async function saveUser(user: User): Promise<void> {
  await post('/users', user)
}

// Photos
export async function savePhoto(photo: { id: string; blob: Blob }): Promise<void> {
  const form = new FormData()
  form.append('id', photo.id)
  form.append('file', photo.blob, `${photo.id}.jpg`)
  const res = await fetch(`${API}/photos`, { method: 'POST', body: form })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: /photos`)
}

export function getPhotoUrl(id: string): string {
  return `${API}/photos/${id}`
}

export async function deletePhoto(id: string): Promise<void> {
  await json(`/photos/${id}`, { method: 'DELETE' })
}

// Export
export async function exportAll() {
  return json('/export')
}

// Import
export async function importAll(data: { workouts: Workout[]; exercises: Exercise[]; muscleGroups: MuscleGroup[] }) {
  await post('/import', data)
}
