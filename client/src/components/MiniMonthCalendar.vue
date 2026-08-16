<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import { useWorkoutStore } from '@/stores/workoutStore'
import type { Workout } from '@/types'

const router = useRouter()
const workoutStore = useWorkoutStore()

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

interface DayCell {
  date: string
  day: number
  inMonth: boolean
  isToday: boolean
  workouts: Workout[]
}

const now = dayjs()
const monthLabel = computed(() =>
  now.format('MMMM').replace(/^./, (c) => c.toUpperCase()),
)

const workoutsByDate = computed(() => {
  const map = new Map<string, Workout[]>()
  for (const w of workoutStore.workouts) {
    const key = dayjs(w.date).format('YYYY-MM-DD')
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(w)
  }
  return map
})

// Только текущий месяц — узкая боковая панель, полный год сюда не влезет
const cells = computed<DayCell[]>(() => {
  const first = now.startOf('month')
  const startWeekday = (first.day() + 6) % 7 // понедельник = 0
  const daysInMonth = first.daysInMonth()
  const todayKey = now.format('YYYY-MM-DD')
  const out: DayCell[] = []

  for (let i = 0; i < startWeekday; i++) {
    out.push({ date: '', day: 0, inMonth: false, isToday: false, workouts: [] })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = first.date(d).format('YYYY-MM-DD')
    out.push({
      date,
      day: d,
      inMonth: true,
      isToday: date === todayKey,
      workouts: workoutsByDate.value.get(date) || [],
    })
  }
  while (out.length % 7 !== 0) {
    out.push({ date: '', day: 0, inMonth: false, isToday: false, workouts: [] })
  }
  return out
})

function openDay(cell: DayCell) {
  const first = cell.workouts[0]
  if (!first) return
  router.push({ name: 'edit-workout', params: { id: first.id } })
}
</script>

<template>
  <div class="mini-cal">
    <div class="mc-header">
      <span class="mc-month">{{ monthLabel }}</span>
      <router-link to="/calendar" class="mc-link">весь год</router-link>
    </div>
    <div class="mc-weekdays">
      <span v-for="wd in WEEKDAYS" :key="wd">{{ wd[0] }}</span>
    </div>
    <div class="mc-days">
      <div
        v-for="(cell, ci) in cells"
        :key="ci"
        class="mc-day"
        :class="{
          'mc-day-empty': !cell.inMonth,
          'mc-day-today': cell.isToday,
          'mc-day-has': cell.workouts.length > 0,
        }"
        @click="openDay(cell)"
      >
        <span v-if="cell.inMonth">{{ cell.day }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mini-cal {
  padding: 8px;
  background: #181818;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
}

.mc-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 6px;
}

.mc-month {
  font-size: 0.8rem;
  font-weight: 600;
  color: #ccc;
}

.mc-link {
  font-size: 0.65rem;
  color: #5a8;
  text-decoration: none;
}

.mc-link:hover {
  text-decoration: underline;
}

.mc-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 3px;
}

.mc-weekdays span {
  text-align: center;
  font-size: 0.55rem;
  color: #555;
  text-transform: uppercase;
}

.mc-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.mc-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  color: #888;
  border-radius: 3px;
}

.mc-day-empty {
  visibility: hidden;
}

.mc-day-has {
  background: #1a2a22;
  color: #ccc;
  cursor: pointer;
}

.mc-day-has:hover {
  background: #223a2c;
}

.mc-day-today {
  border: 1px solid #2a7a4a;
  color: #5a8;
  font-weight: 700;
}
</style>
