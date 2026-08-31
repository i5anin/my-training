<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import dayjs from 'dayjs'
import { useRoute, useRouter } from 'vue-router'
import { useWorkoutStore } from '@/stores/workoutStore'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { Workout } from '@/types'

const route = useRoute()
const router = useRouter()
const workoutStore = useWorkoutStore()

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

interface DayCell {
  date: string
  day: number
  inMonth: boolean
  isToday: boolean
  isSelected: boolean
  workouts: Workout[]
}

const today = dayjs()
// Сдвиг просматриваемого месяца от текущего — сама «сегодня» остаётся
// привязана к реальной дате, не к листаемому месяцу
const monthOffset = ref(0)
const viewedMonth = computed(() => today.add(monthOffset.value, 'month'))
const monthLabel = computed(() =>
  viewedMonth.value.format('MMMM YYYY').replace(/^./, (c) => c.toUpperCase()),
)

function prevMonth() { monthOffset.value-- }
function nextMonth() { monthOffset.value++ }

/** Дата открытой тренировки — её день подсвечен как выбранный */
const selectedDate = computed(() => {
  const id = Number(route.params.id)
  if (!id) return null
  return workoutStore.workouts.find((w) => w.id === id)?.date ?? null
})

// Открыли тренировку другого месяца — календарь переходит к нему сам
watch(selectedDate, (date) => {
  if (!date) return
  monthOffset.value = dayjs(date).startOf('month').diff(today.startOf('month'), 'month')
}, { immediate: true })

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
  const first = viewedMonth.value.startOf('month')
  const startWeekday = (first.day() + 6) % 7 // понедельник = 0
  const daysInMonth = first.daysInMonth()
  const todayKey = today.format('YYYY-MM-DD')
  const out: DayCell[] = []

  const empty = { date: '', day: 0, inMonth: false, isToday: false, isSelected: false, workouts: [] }

  for (let i = 0; i < startWeekday; i++) out.push({ ...empty })
  for (let d = 1; d <= daysInMonth; d++) {
    const date = first.date(d).format('YYYY-MM-DD')
    out.push({
      date,
      day: d,
      inMonth: true,
      isToday: date === todayKey,
      isSelected: date === selectedDate.value,
      workouts: workoutsByDate.value.get(date) || [],
    })
  }
  while (out.length % 7 !== 0) out.push({ ...empty })
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
      <button class="mc-nav" @click="prevMonth"><ChevronLeft class="size-3" /></button>
      <span class="mc-month">{{ monthLabel }}</span>
      <button class="mc-nav" @click="nextMonth"><ChevronRight class="size-3" /></button>
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
          'mc-day-selected': cell.isSelected,
          'mc-day-has': cell.workouts.length > 0,
        }"
        @click="openDay(cell)"
      >
        <span v-if="cell.inMonth" class="mc-day-num">{{ cell.day }}</span>
        <span v-if="cell.workouts.length" class="mc-day-dot" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.mini-cal {
  padding: 12px;
  background: #181818;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
}

.mc-header {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.mc-month {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 600;
  color: #ccc;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.mc-nav {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 2px;
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  border-radius: 4px;
  flex-shrink: 0;
}

.mc-nav:hover {
  background: #2a2a2a;
  color: #ccc;
}

.mc-link {
  font-size: 0.75rem;
  color: #5a8;
  text-decoration: none;
}

.mc-link:hover {
  text-decoration: underline;
}

.mc-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 4px;
}

.mc-weekdays span {
  text-align: center;
  font-size: 0.65rem;
  color: #555;
  text-transform: uppercase;
}

.mc-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 3px;
}

.mc-day {
  aspect-ratio: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  font-size: 0.85rem;
  color: #888;
  border-radius: 4px;
}

.mc-day-num {
  line-height: 1;
}

.mc-day-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #5a8;
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

/* Сегодня — рамка. Видна и на пустом дне, и на дне с тренировкой */
.mc-day-today {
  box-shadow: inset 0 0 0 2px #2a7a4a;
  color: #7ec9a3;
  font-weight: 700;
}

.mc-day-today .mc-day-dot {
  background: #8fd;
}

/* Открытая тренировка — заливка: сразу видно, какой день читаешь */
.mc-day-selected {
  background: #2a7a4a;
  color: #fff;
  font-weight: 700;
}

.mc-day-selected .mc-day-dot {
  background: #fff;
}

/* Сегодня и открытая одновременно — заливка со светлой рамкой */
.mc-day-selected.mc-day-today {
  box-shadow: inset 0 0 0 2px #8fd;
  color: #fff;
}

.mc-day-selected:hover {
  background: #358f58;
}
</style>
