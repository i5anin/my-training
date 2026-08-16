<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { findAnomalies, anomalyLabel, type AnomalyKind } from '@/composables/anomalies'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { CheckCircle2 } from 'lucide-vue-next'

dayjs.locale('ru')

const router = useRouter()
const workoutStore = useWorkoutStore()
const catalogStore = useCatalogStore()

const all = computed(() =>
  findAnomalies(workoutStore.workouts, catalogStore.exercises),
)

// Фильтр по типу проблемы
const activeKind = ref<AnomalyKind | 'all'>('all')

const kinds = computed(() => {
  const counts = new Map<AnomalyKind, number>()
  for (const a of all.value) counts.set(a.kind, (counts.get(a.kind) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])
})

const list = computed(() =>
  activeKind.value === 'all'
    ? all.value
    : all.value.filter((a) => a.kind === activeKind.value),
)

const bySeverity = computed(() => ({
  high: all.value.filter((a) => a.severity === 'high').length,
  medium: all.value.filter((a) => a.severity === 'medium').length,
  low: all.value.filter((a) => a.severity === 'low').length,
}))

function fmt(date: string) {
  return dayjs(date).format('dd DD.MM.YY')
}
</script>

<template>
  <div class="anom-view">
    <div class="anom-head">
      <h2 class="anom-title">Проверка данных</h2>
      <span class="anom-counts">
        <span class="sev high">{{ bySeverity.high }} важных</span>
        <span class="sev medium">{{ bySeverity.medium }} средних</span>
        <span class="sev low">{{ bySeverity.low }} мелких</span>
      </span>
    </div>

    <!-- Всё чисто -->
    <div v-if="!all.length" class="anom-clean">
      <CheckCircle2 class="size-10" />
      <div>Аномалий не найдено — {{ workoutStore.workouts.length }} тренировок проверено</div>
    </div>

    <template v-else>
      <!-- Фильтр по типу -->
      <div class="anom-filter">
        <button
          class="kind-btn" :class="{ active: activeKind === 'all' }"
          @click="activeKind = 'all'"
        >Все <span class="kind-n">{{ all.length }}</span></button>
        <button
          v-for="[kind, n] in kinds" :key="kind"
          class="kind-btn" :class="{ active: activeKind === kind }"
          @click="activeKind = kind"
        >{{ anomalyLabel(kind) }} <span class="kind-n">{{ n }}</span></button>
      </div>

      <!-- Список -->
      <table class="anom-table">
        <tbody>
          <tr
            v-for="(a, i) in list" :key="i"
            class="anom-row"
            @click="router.push({ name: 'edit-workout', params: { id: a.workoutId } })"
          >
            <td class="td-sev">
              <Tooltip>
                <TooltipTrigger as-child>
                  <span class="dot" :class="a.severity"></span>
                </TooltipTrigger>
                <TooltipContent>
                  {{ a.severity === 'high' ? 'Важно' : a.severity === 'medium' ? 'Средне' : 'Мелочь' }}
                </TooltipContent>
              </Tooltip>
            </td>
            <td class="td-wid">#{{ a.workoutId }}</td>
            <td class="td-date">{{ fmt(a.date) }}</td>
            <td class="td-kind"><span class="kind-tag">{{ anomalyLabel(a.kind) }}</span></td>
            <td class="td-what">
              <div class="what-title">{{ a.title }}</div>
              <div class="what-detail">{{ a.detail }}</div>
            </td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>

<style scoped>
.anom-view {
  padding: 16px;
  height: 100%;
  overflow-y: auto;
  box-sizing: border-box;
}

.anom-head {
  display: flex;
  align-items: baseline;
  gap: 16px;
  margin-bottom: 14px;
  flex-wrap: wrap;
}

.anom-title {
  margin: 0;
  font-size: 1.3rem;
  font-weight: bold;
  color: #eee;
}

.anom-counts {
  display: flex;
  gap: 10px;
  font-size: 0.8rem;
}

.sev.high { color: #d66; }
.sev.medium { color: #c9a227; }
.sev.low { color: #777; }

.anom-clean {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 60px 0;
  color: #3a7a55;
}

/* ── Фильтр ── */
.anom-filter {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.kind-btn {
  padding: 4px 10px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #1a1a1a;
  color: #888;
  cursor: pointer;
  font-size: 0.78rem;
}

.kind-btn:hover { border-color: #5a8; color: #ccc; }
.kind-btn.active { border-color: #5a8; background: #1a2a22; color: #5a8; }

.kind-n {
  color: #555;
  font-size: 0.72rem;
  margin-left: 3px;
}

.kind-btn.active .kind-n { color: #5a8; }

/* ── Таблица ── */
.anom-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}

.anom-row {
  cursor: pointer;
  border-bottom: 1px solid #1e1e1e;
}

.anom-row:hover { background: #1a1a1a; }

.anom-table td {
  padding: 8px 10px;
  vertical-align: top;
}

.td-sev { width: 20px; }

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 5px;
}

.dot.high { background: #d66; }
.dot.medium { background: #c9a227; }
.dot.low { background: #555; }

.td-wid {
  width: 48px;
  color: #5a8;
  font-weight: bold;
  white-space: nowrap;
}

.td-date {
  width: 92px;
  color: #888;
  font-size: 0.78rem;
  white-space: nowrap;
}

.td-kind { width: 150px; }

.kind-tag {
  display: inline-block;
  padding: 1px 7px;
  border-radius: 4px;
  background: #222;
  color: #999;
  font-size: 0.7rem;
  white-space: nowrap;
}

.what-title { color: #ddd; }

.what-detail {
  color: #666;
  font-size: 0.76rem;
  margin-top: 2px;
}
</style>
