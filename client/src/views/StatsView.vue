<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { barOf, best1RM, mainSets, tonnage } from '@/composables/strength'
import { isBigThree } from '@/composables/bigThree'
import SparkCell from '@/components/SparkCell.vue'
import MgIcon from '@/components/MgIcon.vue'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

const router = useRouter()
const workoutStore = useWorkoutStore()
const catalogStore = useCatalogStore()

// ─── Упражнения ──────────────────────────────────────────
type MG = 'all' | string
const filterMg = ref<MG>('all')


interface ExStat {
  exerciseId: string
  name: string
  muscleGroups: string[]
  count: number
  best1RM: number
  pts1RM: number[]   // max1RM per workout, chronological
  ptsVol: number[]   // tonnage per workout
}

const exStats = computed<ExStat[]>(() => {
  // Хронология по дате: id не хронологичен для записей задним числом
  const sorted = [...workoutStore.workouts].sort(
    (a, b) => a.date.localeCompare(b.date) || a.id - b.id,
  )
  const map = new Map<string, ExStat>()

  for (const w of sorted) {
    for (const entry of (w.entries || [])) {
      const sets = mainSets(entry.sets)
      const weights = sets.map((s) => s.weight ?? 0).filter((x) => x > 0)
      if (!weights.length) continue

      const ex = catalogStore.getExerciseById(entry.exerciseId)
      if (!ex) continue

      // Гриф: из тренировки, иначе из каталога упражнения
      const bar = barOf(entry, ex)
      const max1RM = best1RM(sets, bar)
      if (!max1RM) continue

      if (!map.has(entry.exerciseId)) {
        map.set(entry.exerciseId, {
          exerciseId: entry.exerciseId,
          name: ex.name,
          muscleGroups: ex.muscleGroups,
          count: 0,
          best1RM: 0,
          pts1RM: [],
          ptsVol: [],
        })
      }
      const stat = map.get(entry.exerciseId)!
      stat.count++
      stat.best1RM = Math.max(stat.best1RM, max1RM)
      stat.pts1RM.push(max1RM)
      stat.ptsVol.push(tonnage(sets, bar))
    }
  }

  return [...map.values()].sort((a, b) => b.count - a.count || b.best1RM - a.best1RM)
})

const filteredStats = computed(() => {
  if (filterMg.value === 'all') return exStats.value
  return exStats.value.filter((s) => s.muscleGroups.includes(filterMg.value))
})

// все группы мышц которые есть в данных
const activeMgs = computed(() => {
  const seen = new Set<string>()
  for (const s of exStats.value) s.muscleGroups.forEach((m) => seen.add(m))
  return [...seen]
})

const SW = 88, SH = 30

// ─── Активная метрика ─────────────────────────────────────
const metric = ref<'1rm' | 'vol'>('1rm')
</script>

<template>
  <div class="stats-view">

    <!-- ─── Метрика + фильтр ─── -->
    <div class="toolbar">
      <div class="metric-tabs">
        <button class="mtab" :class="{ active: metric === '1rm' }" @click="metric = '1rm'">1ПМ</button>
        <button class="mtab" :class="{ active: metric === 'vol' }" @click="metric = 'vol'">Объём</button>
      </div>
      <div class="mg-filter">
        <button
          class="mgf" :class="{ active: filterMg === 'all' }"
          @click="filterMg = 'all'"
        >Все</button>
        <Tooltip v-for="mg in activeMgs" :key="mg">
          <TooltipTrigger as-child>
            <button
              class="mgf" :class="{ active: filterMg === mg }"
              @click="filterMg = filterMg === mg ? 'all' : mg"
            ><MgIcon :id="mg" :size="16" /></button>
          </TooltipTrigger>
          <TooltipContent>
            {{ catalogStore.muscleGroups.find(m => m.id === mg)?.label ?? mg }}
          </TooltipContent>
        </Tooltip>
      </div>
    </div>

    <!-- ─── Список упражнений ─── -->
    <div class="ex-list">
      <div v-if="filteredStats.length === 0" class="no-ex">Нет данных</div>

      <div
        v-for="s in filteredStats"
        :key="s.exerciseId"
        class="ex-row"
        :class="{ 'big-three': isBigThree(s.exerciseId) }"
        @click="router.push({
          name: 'exercise-chart',
          params: { id: s.exerciseId },
          query: { m: metric === 'vol' ? 'tonnage' : 'max1RM' },
        })"
      >
        <!-- Левая часть: название + мета -->
        <div class="ex-left">
          <div class="ex-name">{{ s.name }}</div>
          <div class="ex-meta">
            <span class="ex-1rm">{{ metric === '1rm' ? s.best1RM + ' кг' : Math.round(s.ptsVol.reduce((a,b)=>Math.max(a,b),0)) + ' кг' }}</span>
            <span class="ex-cnt">{{ s.count }} тр.</span>
            <span class="ex-mgs">
              <MgIcon v-for="m in s.muscleGroups" :key="m" :id="m" :size="14" />
            </span>
          </div>
        </div>

        <!-- Спарклайн -->
        <SparkCell :pts="metric === '1rm' ? s.pts1RM : s.ptsVol" :sw="SW" :sh="SH" />
      </div>
    </div>

  </div>
</template>

<style scoped>
.stats-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 10px;
  gap: 10px;
}

/* ── Тулбар ── */
.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-shrink: 0;
  flex-wrap: wrap;
}
.metric-tabs { display: flex; gap: 4px; }
.mtab {
  padding: 3px 9px;
  border: 1px solid #333;
  border-radius: 5px;
  background: #1a1a1a;
  color: #666;
  cursor: pointer;
  font-size: 0.75rem;
}
.mtab:hover { border-color: #5a8; color: #5a8; }
.mtab.active { border-color: #5a8; background: #1a2a22; color: #5a8; font-weight: 600; }

.mg-filter { display: flex; gap: 3px; flex-wrap: wrap; }
.mgf {
  padding: 2px 6px;
  border: 1px solid #2a2a2a;
  border-radius: 4px;
  background: #1a1a1a;
  color: #888;
  cursor: pointer;
  font-size: 0.8rem;
}
.mgf:hover { border-color: #5a8; }
.mgf.active { border-color: #5a8; background: #1a2a22; }

/* ── Список упражнений ── */
.ex-list { display: flex; flex-direction: column; gap: 2px; }

.no-ex { text-align: center; color: #444; padding: 20px 0; font-size: 0.85rem; }

.ex-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 7px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.1s, border-color 0.1s;
}
.ex-row:hover {
  background: #1a1a1a;
  border-color: #2a2a2a;
}

.ex-left {
  flex: 1;
  min-width: 0;
}
.ex-name {
  font-size: 0.82rem;
  color: #ddd;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}
.ex-meta {
  display: flex;
  gap: 7px;
  align-items: center;
}
.ex-1rm {
  font-size: 0.72rem;
  font-weight: 600;
  color: #5a8;
}
.ex-cnt {
  font-size: 0.68rem;
  color: #555;
}
.ex-mgs {
  font-size: 0.72rem;
  color: #444;
}

</style>
