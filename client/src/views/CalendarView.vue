<script setup lang="ts">
import { computed, ref } from 'vue'
import dayjs from 'dayjs'
import { useRouter } from 'vue-router'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { getMuscleGroupIcon, getMuscleGroupImage } from '@/constants/muscleGroupIcons'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import type { Workout } from '@/types'

const router = useRouter()
const workoutStore = useWorkoutStore()
const catalogStore = useCatalogStore()

const year = ref(dayjs().year())

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
]
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

interface DayCell {
  date: string
  day: number
  inMonth: boolean
  isToday: boolean
  workouts: Workout[]
}

const workoutsByDate = computed(() => {
  const map = new Map<string, Workout[]>()
  for (const w of workoutStore.workouts) {
    const key = dayjs(w.date).format('YYYY-MM-DD')
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(w)
  }
  return map
})

function buildMonth(monthIndex: number): DayCell[] {
  const first = dayjs(new Date(year.value, monthIndex, 1))
  const startWeekday = (first.day() + 6) % 7 // понедельник = 0
  const daysInMonth = first.daysInMonth()
  const todayKey = dayjs().format('YYYY-MM-DD')
  const cells: DayCell[] = []

  for (let i = 0; i < startWeekday; i++) {
    cells.push({ date: '', day: 0, inMonth: false, isToday: false, workouts: [] })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = dayjs(new Date(year.value, monthIndex, d)).format('YYYY-MM-DD')
    cells.push({
      date,
      day: d,
      inMonth: true,
      isToday: date === todayKey,
      workouts: workoutsByDate.value.get(date) || [],
    })
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: '', day: 0, inMonth: false, isToday: false, workouts: [] })
  }
  return cells
}

const months = computed(() => Array.from({ length: 12 }, (_, i) => ({
  index: i,
  name: MONTH_NAMES[i],
  cells: buildMonth(i),
})))

function uniqueMuscleGroups(workouts: Workout[]): string[] {
  const set = new Set<string>()
  for (const w of workouts) for (const mg of (w.muscleGroups || [])) set.add(mg)
  return [...set]
}

function mgIconsFor(workouts: Workout[]) {
  return uniqueMuscleGroups(workouts).slice(0, 3).map((id) => ({ id, image: getMuscleGroupImage(id) }))
}

function dayTitle(cell: DayCell): string {
  if (!cell.workouts.length) return ''
  return cell.workouts.map((w) => {
    const mg = (w.muscleGroups || [])
      .map((id) => catalogStore.muscleGroups.find((g) => g.id === id)?.label || id)
      .join(', ')
    return `#${w.id}: ${mg}`
  }).join('\n')
}

function openDay(cell: DayCell) {
  const first = cell.workouts[0]
  if (!first) return
  router.push({ name: 'edit-workout', params: { id: first.id } })
}

function prevYear() { year.value-- }
function nextYear() { year.value++ }
function goToday() { year.value = dayjs().year() }
</script>

<template>
  <div class="calendar-view">
    <div class="cal-header">
      <button class="btn btn-sm" @click="prevYear"><ChevronLeft class="size-4" /></button>
      <div class="cal-year">{{ year }}</div>
      <button class="btn btn-sm" @click="nextYear"><ChevronRight class="size-4" /></button>
      <button class="btn btn-sm cal-today" @click="goToday">Сегодня</button>
    </div>

    <div class="cal-grid">
      <div v-for="m in months" :key="m.index" class="cal-month">
        <div class="cal-month-title">{{ m.name }}</div>
        <div class="cal-weekdays">
          <span v-for="wd in WEEKDAYS" :key="wd">{{ wd }}</span>
        </div>
        <div class="cal-days">
          <div
            v-for="(cell, ci) in m.cells"
            :key="ci"
            class="cal-day"
            :class="{
              'cal-day-empty': !cell.inMonth,
              'cal-day-today': cell.isToday,
              'cal-day-has': cell.workouts.length > 0,
            }"
            :title="dayTitle(cell)"
            @click="openDay(cell)"
          >
            <span v-if="cell.inMonth" class="cal-day-num">{{ cell.day }}</span>
            <div v-if="cell.workouts.length" class="cal-day-icons">
              <template v-for="ic in mgIconsFor(cell.workouts)" :key="ic.id">
                <img v-if="ic.image" :src="ic.image" :alt="ic.id" class="cal-icon-img" />
                <span v-else class="cal-icon-emoji">{{ getMuscleGroupIcon(ic.id) }}</span>
              </template>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-view {
  padding: 16px;
  height: 100%;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.cal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.cal-year {
  font-size: 1.3rem;
  font-weight: 700;
  min-width: 64px;
  text-align: center;
}

.cal-today {
  margin-left: auto;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #444;
  border-radius: 6px;
  background: #252525;
  color: #eee;
  cursor: pointer;
  font-size: 0.85rem;
}
.btn:hover { background: #333; }
.btn-sm { padding: 6px 10px; }

.cal-grid {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 10px;
}

.cal-month {
  background: #181818;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  padding: 8px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.cal-month-title {
  font-weight: 600;
  font-size: 0.85rem;
  margin-bottom: 4px;
  color: #ccc;
  flex-shrink: 0;
}

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 2px;
  flex-shrink: 0;
}

.cal-weekdays span {
  text-align: center;
  font-size: 0.58rem;
  color: #555;
  text-transform: uppercase;
}

.cal-days {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  grid-template-rows: repeat(6, 1fr);
  gap: 2px;
}

.cal-day {
  border-radius: 4px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  color: #888;
  position: relative;
  min-height: 0;
  min-width: 0;
  overflow: hidden;
}

.cal-day-empty {
  visibility: hidden;
}

.cal-day-today .cal-day-num {
  color: #5a8;
  font-weight: 700;
}

.cal-day-today {
  border: 1px solid #2a7a4a;
}

.cal-day-has {
  background: #1a2a22;
  cursor: pointer;
}
.cal-day-has:hover {
  background: #223a2c;
}

.cal-day-num {
  line-height: 1;
}

.cal-day-icons {
  display: flex;
  gap: 1px;
  margin-top: 1px;
}

.cal-icon-img {
  width: 11px;
  height: 11px;
  object-fit: cover;
  border-radius: 2px;
}

.cal-icon-emoji {
  font-size: 0.6rem;
  line-height: 1;
}

@media (max-width: 600px) {
  /* Одна колонка месяцев: включаем прокрутку, снимаем фиксированные строки,
     иначе 9 из 12 месяцев обрезаются */
  .calendar-view {
    overflow-y: auto;
  }

  .cal-grid {
    grid-template-columns: 1fr;
    grid-template-rows: none;
    grid-auto-rows: minmax(230px, auto);
  }
}
</style>
