<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { barOf, best1RM, mainSets, tonnage, totalWeight } from '@/composables/strength'
import ApexChart from 'vue3-apexcharts'
import type { ApexOptions } from 'apexcharts'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
dayjs.locale('ru')

const route  = useRoute()
const router = useRouter()
const workoutStore  = useWorkoutStore()
const catalogStore  = useCatalogStore()

const exerciseId = computed(() => route.params.id as string)
const exercise   = computed(() => catalogStore.getExerciseById(exerciseId.value))


// --- Точки данных ---
interface DataPoint {
  date: string
  workoutId: number
  maxWeight: number
  avgWeight: number
  maxReps: number
  max1RM: number
  tonnage: number
}

const points = computed<DataPoint[]>(() => {
  const pts: DataPoint[] = []
  // Хронология по дате: id не хронологичен для записей задним числом
  const sorted = [...workoutStore.workouts].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id - b.id,
  )
  for (const w of sorted) {
    const entry = w.entries?.find((e) => e.exerciseId === exerciseId.value)
    if (!entry?.sets?.length) continue
    const sets = mainSets(entry.sets)
    if (!sets.length) continue
    // Гриф: из тренировки, иначе из каталога упражнения
    const bar = barOf(entry, exercise.value)
    const weights = sets.map((s) => totalWeight(s, bar)).filter((x) => x > 0)
    if (!weights.length) continue
    pts.push({
      date: w.date,
      workoutId: w.id,
      maxWeight: Math.max(...weights),
      avgWeight: Math.round(weights.reduce((a, b) => a + b, 0) / weights.length * 10) / 10,
      maxReps: Math.max(...sets.map((s) => s.reps ?? 0)),
      max1RM: best1RM(sets, bar),
      tonnage: Math.round(tonnage(sets, bar)),
    })
  }
  return pts
})

type ChartKey = 'maxWeight' | 'avgWeight' | 'max1RM' | 'tonnage'

const activeMetric = computed({
  // Валидация query: битый ?m=foo не должен ломать график
  get: (): ChartKey => {
    const k = route.query.m as string
    return k && k in metricLabels ? (k as ChartKey) : 'max1RM'
  },
  set: (v) => router.replace({ query: { m: v } })
})

const metricLabels: Record<ChartKey, string> = {
  maxWeight: 'Макс. вес',
  avgWeight: 'Ср. вес',
  max1RM:    '1ПМ (Эпли)',
  tonnage:   'Объём кг',
}

const values = computed(() => points.value.map(p => p[activeMetric.value]))

// --- ApexCharts (та же библиотека, что в tools-soft) ---
const series = computed(() => [
  { name: metricLabels[activeMetric.value], data: values.value },
])

const chartOptions = computed((): ApexOptions => ({
  chart: {
    type: 'area',
    background: 'transparent',
    foreColor: '#777',
    toolbar: { show: false },
    zoom: { enabled: false },
    animations: { enabled: false },
    events: {
      // Клик по точке — переход к тренировке
      markerClick: (
        _e: MouseEvent,
        _ctx?: unknown,
        cfg?: { dataPointIndex: number },
      ) => {
        const p = points.value[cfg?.dataPointIndex ?? -1]
        if (p) router.push({ name: 'edit-workout', params: { id: p.workoutId } })
      },
    },
  },
  theme: { mode: 'dark' },
  colors: ['#5a8'],
  stroke: { curve: 'straight', width: 2 },
  fill: { type: 'gradient', gradient: { opacityFrom: 0.25, opacityTo: 0.02 } },
  markers: { size: 4, strokeColors: '#121212', hover: { size: 6 } },
  grid: { borderColor: '#2a2a2a' },
  dataLabels: { enabled: false },
  xaxis: {
    categories: points.value.map((p) => dayjs(p.date).format('DD.MM.YY')),
    tooltip: { enabled: false },
    axisBorder: { color: '#2a2a2a' },
    axisTicks: { color: '#2a2a2a' },
  },
  yaxis: {
    labels: { formatter: (v: number) => String(Math.round(v)) },
  },
  tooltip: {
    theme: 'dark',
    y: {
      formatter: (v: number, o?: { dataPointIndex: number }) => {
        const p = points.value[o?.dataPointIndex ?? -1]
        return `${Math.round(v)} кг${p ? ' · #' + p.workoutId : ''}`
      },
    },
  },
}))
</script>

<template>
  <div class="chart-view">
    <div class="chart-header">
      <button class="back-btn" @click="router.back()">← Назад</button>
      <h2 class="chart-title">{{ exercise?.name ?? exerciseId }}</h2>
    </div>

    <div v-if="points.length < 2" class="no-data">
      Недостаточно данных — нужно минимум 2 тренировки с этим упражнением
    </div>

    <template v-else>
      <!-- Metric selector -->
      <div class="metric-tabs">
        <button
          v-for="(label, key) in metricLabels" :key="key"
          class="mtab" :class="{ active: activeMetric === key }"
          @click="activeMetric = key as ChartKey"
        >{{ label }}</button>
      </div>

      <!-- График (ApexCharts) -->
      <div class="svg-wrap">
        <ApexChart type="area" height="260" :options="chartOptions" :series="series" />
      </div>

      <!-- Summary cards -->
      <div class="summary-row">
        <div class="scard">
          <span class="sval">{{ Math.max(...points.map(p => p.maxWeight)) }} кг</span>
          <span class="slbl">Макс. вес</span>
        </div>
        <div class="scard">
          <span class="sval">{{ Math.max(...points.map(p => p.max1RM)) }} кг</span>
          <span class="slbl">Лучший 1ПМ</span>
        </div>
        <div class="scard">
          <span class="sval">{{ Math.round(points.map(p => p.avgWeight).reduce((a,b) => a+b, 0) / points.length) }} кг</span>
          <span class="slbl">Ср. вес</span>
        </div>
        <div class="scard">
          <span class="sval">{{ Math.max(...points.map(p => p.tonnage)) }} кг</span>
          <span class="slbl">Макс. объём</span>
        </div>
        <div class="scard">
          <span class="sval">{{ points.length }}</span>
          <span class="slbl">Тренировок</span>
        </div>
      </div>

      <!-- Table -->
      <table class="data-table">
        <thead>
          <tr>
            <th>Дата</th><th>#</th><th>Макс. вес</th><th>Ср. вес</th>
            <th>Макс. повт.</th><th>1ПМ</th><th>Объём</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in [...points].reverse()" :key="p.workoutId"
            class="data-row" @click="router.push({ name: 'edit-workout', params: { id: p.workoutId } })">
            <td>{{ dayjs(p.date).format('dd DD.MM.YY') }}</td>
            <td class="td-id">#{{ p.workoutId }}</td>
            <td>{{ p.maxWeight }} кг</td>
            <td>{{ p.avgWeight }} кг</td>
            <td>{{ p.maxReps }}</td>
            <td class="td-orm">{{ p.max1RM }} кг</td>
            <td>{{ p.tonnage }} кг</td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<style scoped>
.chart-view {
  padding: 16px;
  max-width: 760px;
}

.chart-header {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-bottom: 16px;
}

.back-btn {
  background: none;
  border: 1px solid #444;
  border-radius: 5px;
  color: #aaa;
  padding: 4px 10px;
  cursor: pointer;
  font-size: 0.85rem;
}
.back-btn:hover { border-color: #5a8; color: #5a8; }

.chart-title {
  font-size: 1.1rem;
  font-weight: bold;
  color: #eee;
  margin: 0;
}

.no-data {
  color: #555;
  padding: 40px 0;
  text-align: center;
  font-size: 0.9rem;
}

.metric-tabs {
  display: flex;
  gap: 6px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.mtab {
  padding: 4px 10px;
  border: 1px solid #333;
  border-radius: 5px;
  background: #1a1a1a;
  color: #777;
  cursor: pointer;
  font-size: 0.8rem;
}
.mtab:hover { border-color: #5a8; color: #5a8; }
.mtab.active { border-color: #5a8; background: #1a2a22; color: #5a8; font-weight: 600; }

.svg-wrap {
  background: #141414;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  margin-bottom: 16px;
  overflow: hidden;
}

.summary-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.scard {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  padding: 6px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 80px;
}

.sval {
  font-size: 1rem;
  font-weight: bold;
  color: #5a8;
}

.slbl {
  font-size: 0.65rem;
  color: #555;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}

.data-table th {
  color: #555;
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 4px 8px;
  border-bottom: 1px solid #2a2a2a;
  white-space: nowrap;
}

.data-row {
  cursor: pointer;
  border-bottom: 1px solid #1e1e1e;
}
.data-row:hover { background: #1a1a1a; }

.data-row td {
  padding: 5px 8px;
  color: #aaa;
  white-space: nowrap;
}

.td-id { color: #5a8; font-weight: bold; }
.td-orm { color: #c8a; font-weight: 600; }
</style>
