<script setup lang="ts">
import { computed } from 'vue'
import dayjs from 'dayjs'
import 'dayjs/locale/ru'
import type { SetRow, Workout } from '@/types'
import { useCatalogStore } from '@/stores/catalogStore'
import { getPhotoUrl } from '@/db'
import { isBigThree } from '@/composables/bigThree'
import MgIcon from '@/components/MgIcon.vue'
import MgChip from '@/components/MgChip.vue'
import ExerciseThumb from '@/components/ExerciseThumb.vue'
import ExerciseTags from '@/components/ExerciseTags.vue'
import { distinctByLetter } from '@/constants/muscleGroupIcons'
import TagBadge from '@/components/TagBadge.vue'
import { kindsIn, musclesOnly } from '@/constants/workloadKinds'

dayjs.locale('ru')

const props = defineProps<{ workout: Workout }>()

const catalog = useCatalogStore()

const dateLabel = computed(() => dayjs(props.workout.date).format('dd, D MMMM YYYY'))

// Мышцы всей тренировки: собираются из упражнений, а не только из
// групп, которыми сессия помечена — в шапке виден полный охват
const groups = computed(() => {
  const active: string[] = [...(props.workout.muscleGroups || [])]
  const weak: string[] = []

  for (const entry of props.workout.entries || []) {
    const exercise = catalog.getExerciseById(entry.exerciseId)
    if (!exercise) continue
    for (const id of exercise.muscleGroups) {
      if (!active.includes(id)) active.push(id)
    }
    for (const id of exercise.secondaryMuscleGroups || []) {
      if (!weak.includes(id)) weak.push(id)
    }
  }

  const weakOnly = weak.filter((id) => !active.includes(id))

  return {
    // Вид нагрузки идёт отдельной меткой: кардио и растяжка не мышцы
    kinds: kindsIn([...active, ...weakOnly]),
    letters: distinctByLetter(musclesOnly(active)),
    active: musclesOnly(active),
    weak: musclesOnly(weakOnly),
  }
})

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

</script>

<template>
  <div class="read-view">
    <!-- Шапка: номер, дата, группы, описание -->
    <div class="rv-head">
      <span class="rv-id">Тренировка #{{ workout.id }}</span>
      <span class="rv-date">{{ dateLabel }}</span>
      <span class="rv-groups">
        <TagBadge v-for="k in groups.kinds" :key="k.id" :label="k.label" :color="k.color" />
        <MgIcon v-for="id in groups.letters" :key="id" :id="id" :size="18" />
        <MgChip v-for="id in groups.active" :key="id" :id="id" plain />
        <MgChip v-for="id in groups.weak" :key="id" :id="id" plain muted />
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
          <td class="rv-num">
            <span class="rv-num-cell">
              {{ i + 1 }}
              <ExerciseThumb :exercise-id="e.exerciseId" :size="46" />
            </span>
          </td>
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
            <ExerciseTags :exercise-id="e.exerciseId" />
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
  flex-wrap: wrap;
  gap: 6px;
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
  /* Номер плюс портретная миниатюра */
  width: 92px;
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
  padding-left: 16px;
}
.rv-num-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
