import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Workout } from '@/types'
import { getAllWorkouts } from '@/db'

export const useWorkoutStore = defineStore('workouts', () => {
  const workouts = ref<Workout[]>([])

  async function load() {
    workouts.value = await getAllWorkouts()
    // По дате (новые сверху), id — тай-брейк: id не хронологичен
    // для тренировок, внесённых задним числом
    workouts.value.sort(
      (a, b) => b.date.localeCompare(a.date) || b.id - a.id,
    )
  }

  return { workouts, load }
})
