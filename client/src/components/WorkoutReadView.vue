<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import type { SetRow, Workout } from '@/types'
import { useCatalogStore } from '@/stores/catalogStore'
import { getPhotoUrl } from '@/db'
import { isBigThree } from '@/composables/bigThree'
import MgIcon from '@/components/MgIcon.vue'

dayjs.locale('ru')

const props = defineProps<{ workout: Workout }>()

const catalog = useCatalogStore()

const dateLabel = computed(() => dayjs(props.workout.date).format('dd, D MMMM YYYY'))

const groups = computed(() =>
  (props.workout.muscleGroups || []).map((id) => ({
    id,
    label: catalog.muscleGroups.find((g) => g.id === id)?.label ?? id,
  })),
)

// Колонка = основной подход; добивки прикрепляются под него,
// как в редакторе, а не занимают собственную колонку
interface ReadCol {
  main: SetRow
  burnouts: SetRow[]
}

function entryCols(e: { sets?: SetRow[] }): ReadCol[] {
  const cols: ReadCol[] = []
  for (const s of e.sets || []) {
    const lastCol = cols[cols.length - 1]
    if (s.isBurnout && lastCol) lastCol.burnouts.push(s)
    else cols.push({ main: s, burnouts: [] })
  }
  return cols
}

const colsByEntry = computed(() => (props.workout.entries || []).map(entryCols))

const maxSets = computed(() => Math.max(1, ...colsByEntry.value.map((c) => c.length)))

function exName(id: string) {
  return catalog.getExerciseById(id)?.name ?? id
}

// Главная (первая) группа мышц конкретного упражнения — не всей
// тренировки: у одной сессии могут быть упражнения на разные группы
function primaryGroup(exerciseId: string): string | null {
  return catalog.getExerciseById(exerciseId)?.muscleGroups?.[0] ?? null
}
</script>

<template>
  <div class="read-view">
    <!-- Шапка: номер, дата, группы, описание -->
    <div class="rv-head">
      <span class="rv-id">Тренировка #{{ workout.id }}</span>
      <span class="rv-date">{{ dateLabel }}</span>
      <span class="rv-groups">
        <span v-for="g in groups" :key="g.id" class="rv-group">
          <MgIcon :id="g.id" :size="16" />{{ g.label }}
        </span>
      </span>
    </div>
    <p v-if="workout.description" class="rv-desc">{{ workout.description }}</p>

    <!-- Таблица как на бумажном бланке: упражнение | подходы -->
    <table class="rv-table">
      <thead>
        <tr>
          <th class="rv-num">№</th>
          <th class="rv-ex">Упражнение</th>
          <th v-for="n in maxSets" :key="n" class="rv-set-h">{{ n }}</th>
          <th class="rv-mg-h"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(e, i) in (workout.entries || [])"
          :key="e.id"
          :class="{ 'big-three': isBigThree(e.exerciseId) }"
        >
          <td class="rv-num">{{ i + 1 }}</td>
          <td class="rv-ex">
            <div class="rv-ex-name">{{ exName(e.exerciseId) }}</div>
            <div v-if="e.description" class="rv-ex-note">{{ e.description }}</div>
          </td>
          <td
            v-for="n in maxSets"
            :key="n"
            class="rv-set"
            :class="{ warmup: colsByEntry[i]?.[n - 1]?.main.isWarmup }"
          >
            <template v-if="colsByEntry[i]?.[n - 1]">
              <div class="rv-set-val">
                <span class="rv-w">{{ colsByEntry[i]![n - 1]!.main.weight }}</span>
                <span class="rv-x">×</span>
                <span class="rv-r">{{ colsByEntry[i]![n - 1]!.main.reps }}</span>
              </div>
              <div
                v-for="(b, bi) in colsByEntry[i]![n - 1]!.burnouts"
                :key="bi"
                class="rv-burnout rv-set-val"
              >
                <span class="rv-w">{{ b.weight }}</span>
                <span class="rv-x">×</span>
                <span class="rv-r">{{ b.reps }}</span>
              </div>
            </template>
          </td>
          <td class="rv-mg">
            <MgIcon v-if="primaryGroup(e.exerciseId)" :id="primaryGroup(e.exerciseId)!" :size="26" />
          </td>
        </tr>
      </tbody>
    </table>

    <div class="rv-legend" v-if="workout.entries?.some(e => e.sets?.some(s => s.isBurnout || s.isWarmup))">
      <span class="rv-legend-item warmup">разминка</span>
      <span class="rv-legend-item burnout">добивка</span>
    </div>

    <!-- Фото тренировки -->
    <div v-if="workout.photoIds?.length" class="rv-photos">
      <img v-for="id in workout.photoIds" :key="id" :src="getPhotoUrl(id)" class="rv-photo" />
    </div>
  </div>
</template>

<style scoped>
.read-view {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rv-head {
  display: flex;
  align-items: baseline;
  gap: 16px;
  flex-wrap: wrap;
}

.rv-id {
  font-size: 1.3rem;
  font-weight: bold;
  color: #eee;
}

.rv-date {
  color: #888;
  font-size: 0.9rem;
}

.rv-groups {
  display: inline-flex;
  gap: 12px;
}

.rv-group {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  color: #5a8;
  font-size: 0.85rem;
}

.rv-desc {
  margin: 0;
  color: #999;
  font-size: 0.85rem;
  max-width: 900px;
}

.rv-table {
  border-collapse: collapse;
  font-size: 0.88rem;
  width: fit-content;
}

.rv-table th {
  color: #555;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 5px 10px;
  border-bottom: 1px solid #2a2a2a;
  text-align: left;
}

/* .rv-table th задаёт text-align: left — перебиваем той же
   специфичностью, иначе номера колонок уезжают влево от значений */
.rv-table th.rv-set-h {
  text-align: center;
}

.rv-table td {
  padding: 7px 10px;
  border-bottom: 1px solid #1e1e1e;
  vertical-align: top;
}

.rv-num {
  color: #555;
  width: 30px;
}

.rv-ex {
  min-width: 220px;
  max-width: 380px;
}

.rv-ex-name {
  color: #ddd;
}

.rv-ex-note {
  color: #666;
  font-size: 0.75rem;
  margin-top: 2px;
}

.rv-set {
  text-align: center;
  white-space: nowrap;
  color: #ccc;
  font-variant-numeric: tabular-nums;
}

/* Вес вправо, повторы влево — крестики стоят в одну вертикаль.
   Блок центрируется в ячейке, поэтому добивка встаёт под подход,
   а не в одну строку с ним */
.rv-set-val {
  display: flex;
  align-items: baseline;
  justify-content: center;
  width: fit-content;
  margin: 0 auto;
}

.rv-w {
  min-width: 4ch;
  text-align: right;
}

.rv-r {
  min-width: 2.5ch;
  text-align: left;
}

.rv-x {
  color: #555;
  padding: 0 3px;
}

/* Добивка — компактная плашка под основным подходом */
.rv-burnout {
  margin: 3px auto 0;
  padding: 0 5px;
  border-radius: 3px;
  background: #1e1400;
  color: #c84;
  font-size: 0.8rem;
}

.rv-burnout .rv-x {
  color: #7a5a20;
}

.rv-set.warmup {
  color: #6ab4e8;
}

.rv-mg {
  text-align: center;
  padding-left: 16px;
}

.rv-legend {
  display: flex;
  gap: 10px;
}

.rv-legend-item {
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 4px;
}

.rv-legend-item.warmup {
  background: #0e1a26;
  color: #6ab4e8;
}

.rv-legend-item.burnout {
  background: #1e1400;
  color: #c84;
}

.rv-photos {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.rv-photo {
  width: 96px;
  height: 96px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #2a2a2a;
}
</style>
