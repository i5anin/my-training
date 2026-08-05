<script setup lang="ts">
import { computed } from 'vue'
import { useCatalogStore } from '@/stores/catalogStore'
import { getMuscleGroupIcon, getMuscleGroupImage } from '@/constants/muscleGroupIcons'
import {
  formatDate, fmtDuration, fmtGap, setsCount,
  GAP_WARN_DAYS, type WorkoutListRow,
} from '@/composables/workoutFormat'
import { Copy, X } from 'lucide-vue-next'

const props = defineProps<{
  workout: WorkoutListRow
  active: boolean
  // id других тренировок с тем же составом упражнений и подходов
  duplicates?: number[]
}>()

defineEmits<{
  edit: []
  duplicate: []
  remove: []
}>()

const catalogStore = useCatalogStore()

const dupTitle = computed(
  () => 'Возможный дубликат: ' + (props.duplicates || []).map((x) => `#${x}`).join(', '),
)

// Дата-заглушка, проставленная при переносе из тетради
const dateUnconfirmed = computed(
  () => (props.workout.description || '').includes('ДАТА НЕ ПОДТВЕРЖДЕНА'),
)

const mgTooltip = computed(() =>
  (props.workout.muscleGroups || [])
    .map((id) => catalogStore.muscleGroups.find((mg) => mg.id === id)?.label || id)
    .join(', '),
)

const totalSets = computed(() => setsCount(props.workout.entries))
</script>

<template>
  <tr class="wrow" :class="{ active }" @click="$emit('edit')">
    <td class="td-id">
      #{{ workout.id }}<span
        v-if="duplicates?.length"
        class="dup-badge"
        :title="dupTitle"
      >⚠</span>
    </td>
    <td
      class="td-date"
      :class="{ 'date-unconfirmed': dateUnconfirmed }"
      :title="dateUnconfirmed ? 'Дата не подтверждена (заглушка при переносе из тетради)' : undefined"
    >
      <div>{{ formatDate(workout.date) }}<span v-if="dateUnconfirmed" class="date-q">?</span></div>
      <div
        class="td-gap"
        v-if="workout.gapDays != null"
        :class="{ 'gap-warn': workout.gapDays > GAP_WARN_DAYS }"
      >{{ fmtGap(workout.gapDays) }}</div>
    </td>
    <td class="td-mg" :title="mgTooltip">
      <span v-for="id in (workout.muscleGroups || [])" :key="id" class="mg-icon-wrap">
        <img v-if="getMuscleGroupImage(id)" :src="getMuscleGroupImage(id)!" :alt="id" class="mg-icon-img" />
        <span v-else>{{ getMuscleGroupIcon(id) }}</span>
      </span>
    </td>
    <td
      class="td-ex"
      :title="`Упражнений: ${(workout.entries || []).length} · подходов: ${totalSets}`"
    >
      {{ (workout.entries || []).length }}<span class="td-sets" v-if="totalSets"> / {{ totalSets }}</span>
    </td>
    <td class="td-time">
      <span v-if="workout.totalEditMs && workout.totalEditMs > 0" class="time-badge">{{ fmtDuration(workout.totalEditMs) }}</span>
      <span v-else class="time-none">—</span>
    </td>
    <td class="td-act" @click.stop>
      <button class="act-btn act-dup" title="Дублировать" @click="$emit('duplicate')"><Copy class="size-3.5" /></button>
      <button class="act-btn act-del" title="Удалить" @click="$emit('remove')"><X class="size-3.5" /></button>
    </td>
  </tr>
</template>

<style scoped>
.wrow {
  cursor: pointer;
  border-bottom: 1px solid #1e1e1e;
  transition: background 0.1s;
}

.wrow:hover { background: #1e1e1e; }
.wrow.active { background: #1a2a22; }
.wrow.active .td-id { color: #5a8; }

/* Базовые отступы ячеек — аналог правила «.wt td» родителя (scoped-стили сюда не достают) */
td {
  padding: 5px 4px;
  vertical-align: middle;
}

/* Узкая панель — колонка времени не влезает, прячем (заголовок колонки прячет родитель) */
@container (max-width: 420px) {
  .td-time {
    display: none;
  }
}

.td-id {
  font-weight: bold;
  color: #5a8;
  white-space: nowrap;
  width: 36px;
}

.dup-badge {
  margin-left: 3px;
  font-size: 0.72rem;
  cursor: help;
}

.date-unconfirmed,
.date-unconfirmed > div:first-child {
  color: #b8863b;
}

.date-q {
  margin-left: 2px;
  font-weight: 700;
  color: #b8863b;
}

.td-date {
  white-space: nowrap;
  color: #888;
  font-size: 0.74rem;
  width: 82px;
}

.td-gap {
  font-size: 0.65rem;
  color: #444;
  margin-top: 1px;
}

/* Разрыв дольше месяца — жёлтым */
.td-gap.gap-warn {
  color: #c9a227;
}

.td-mg {
  white-space: nowrap;
  width: 60px;
}

.mg-icon-wrap {
  display: inline-block;
  margin-right: 2px;
}

.mg-icon-img {
  width: 22px;
  height: 22px;
  object-fit: cover;
  border-radius: 4px;
  vertical-align: middle;
}

.td-ex {
  color: #888;
  white-space: nowrap;
  text-align: center;
  width: 36px;
}

.td-sets {
  color: #555;
  font-size: 0.72rem;
}

.td-time {
  text-align: right;
  white-space: nowrap;
  width: 52px;
}

.time-badge {
  color: #5a8;
  font-size: 0.75rem;
  font-weight: 600;
}

.time-none {
  color: #333;
  font-size: 0.75rem;
}

.td-act {
  text-align: right;
  white-space: nowrap;
  width: 56px;
}

/* Иконки действий в строке */
.act-btn {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 0.95rem;
  padding: 3px 5px;
  line-height: 1;
  color: #555;
  border-radius: 4px;
  transition: color 0.1s, background 0.1s;
}
.act-btn:hover { background: #2a2a2a; }
.act-dup:hover { color: #5a8; }
.act-del:hover { color: #d55; }
</style>
