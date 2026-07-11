<script setup lang="ts">
import { computed } from 'vue'
import { useWorkoutStore } from '@/stores/workoutStore'

const ENTRIES_GOAL = 245
const workoutStore = useWorkoutStore()

const totalEntries = computed(() => workoutStore.workouts.length)

const workoutRange = computed(() => {
  if (!workoutStore.workouts.length) return ''
  const ids = workoutStore.workouts.map((w) => w.id)
  const mn = Math.min(...ids), mx = Math.max(...ids)
  return mn === mx ? `#${mn}` : `#${mn}–#${mx}`
})

const avgEditMs = computed((): number | null => {
  const times = workoutStore.workouts
    .map((w) => w.totalEditMs)
    .filter((ms): ms is number => typeof ms === 'number' && ms > 500)
  if (!times.length) return null
  const sorted = [...times].sort((a, b) => a - b)
  const median = sorted[Math.floor(sorted.length / 2)] ?? Infinity
  const clean = times.filter((ms) => ms <= median * 3)
  return clean.length ? clean.reduce((s, ms) => s + ms, 0) / clean.length : null
})

const remaining = computed(() => Math.max(0, ENTRIES_GOAL - totalEntries.value))
const etaMs = computed(() => avgEditMs.value ? remaining.value * avgEditMs.value : null)
const progressPct = computed(() => Math.min(100, (totalEntries.value / ENTRIES_GOAL) * 100))

function fmtDuration(ms: number) {
  const s = Math.round(ms / 1000)
  if (s < 60) return `${s}с`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}м`
  const h = Math.floor(m / 60), rm = m % 60
  return rm ? `${h}ч ${rm}м` : `${h}ч`
}
</script>

<template>
  <div class="progress-summary">
    <div class="progress-header">
      <span class="progress-label">Записи</span>
      <span class="progress-fraction">{{ totalEntries }} / {{ ENTRIES_GOAL }}</span>
    </div>
    <div class="progress-track">
      <div class="progress-fill" :style="{ width: progressPct + '%' }" />
    </div>
    <div class="progress-cells">
      <div class="pcell">
        <span class="pcell-val">{{ totalEntries }}</span>
        <span class="pcell-lbl">добавлено</span>
      </div>
      <div class="pcell" v-if="workoutRange">
        <span class="pcell-val">тр. {{ workoutRange }}</span>
        <span class="pcell-lbl">тренировки</span>
      </div>
      <div class="pcell">
        <span class="pcell-val">{{ remaining }}</span>
        <span class="pcell-lbl">осталось</span>
      </div>
      <div class="pcell">
        <span class="pcell-val">{{ avgEditMs ? '~' + fmtDuration(avgEditMs) : '—' }}</span>
        <span class="pcell-lbl">сред./тр.</span>
      </div>
      <div class="pcell pcell-eta">
        <span class="pcell-val">{{ etaMs ? '~' + fmtDuration(etaMs) : '—' }}</span>
        <span class="pcell-lbl">ETA</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.progress-summary {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  padding: 20px 24px;
  width: 100%;
  max-width: 640px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}
.progress-label { font-size: 0.85rem; color: #777; text-transform: uppercase; letter-spacing: 0.06em; }
.progress-fraction { font-size: 1.2rem; color: #5a8; font-weight: bold; }
.progress-track { height: 6px; background: #2a2a2a; border-radius: 3px; overflow: hidden; margin-bottom: 16px; }
.progress-fill { height: 100%; background: #5a8; border-radius: 3px; transition: width 0.3s; }

.progress-cells { display: flex; gap: 10px; flex-wrap: wrap; }
.pcell {
  flex: 1;
  min-width: 132px;
  background: #111;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.pcell-val { font-size: 1.05rem; font-weight: bold; color: #ddd; line-height: 1.2; white-space: nowrap; }
.pcell-lbl { font-size: 0.7rem; color: #666; line-height: 1.2; }
.pcell-eta .pcell-val { color: #5a8; }
</style>
