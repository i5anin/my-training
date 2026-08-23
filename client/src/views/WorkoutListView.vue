<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useCatalogStore } from '@/stores/catalogStore'
import { deleteWorkout, exportAll, importAll } from '@/db'
import { formatDate, gapDays, type WorkoutListRow } from '@/composables/workoutFormat'
import { useCollapsedMonths } from '@/composables/useCollapsedMonths'
import WorkoutRow from '@/components/WorkoutRow.vue'
import { Upload, Download, Plus, ChevronDown, ChevronsDownUp } from 'lucide-vue-next'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import type { Workout } from '@/types'
import dayjs from 'dayjs'

const route = useRoute()
const router = useRouter()
const workoutStore = useWorkoutStore()
const catalogStore = useCatalogStore()
const search = ref('')

const activeId = computed(() => route.params.id ? Number(route.params.id) : null)

const filtered = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return workoutStore.workouts
  return workoutStore.workouts.filter((w) => {
    const mgLabels = (w.muscleGroups || [])
      .map((id) => catalogStore.muscleGroups.find((mg) => mg.id === id)?.label || '')
      .join(' ')
    const exNames = (w.entries || [])
      .map((e) => catalogStore.getExerciseById(e.exerciseId)?.name || '')
      .join(' ')
    return `${w.date} ${formatDate(w.date)} ${mgLabels} ${exNames} #${w.id}`
      .toLowerCase()
      .includes(q)
  })
})

// Сортировка по дате (не по id — иначе месяцы перемешаются)
function sortByDateDesc(list: Workout[]): Workout[] {
  return [...list].sort((a, b) => {
    const d = dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
    return d !== 0 ? d : b.id - a.id
  })
}

const sortedFiltered = computed(() => sortByDateDesc(filtered.value))

// Разрывы в днях — по полному списку стора: фильтр поиска не должен искажать интервалы
const gapDaysById = computed(() => {
  const list = sortByDateDesc(workoutStore.workouts)
  const map = new Map<number, number | null>()
  list.forEach((w, i) => {
    map.set(w.id, i < list.length - 1 ? gapDays(list[i + 1]!.date, w.date) : null)
  })
  return map
})

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

// Группировка по месяцам
const groups = computed(() => {
  const rows: WorkoutListRow[] = sortedFiltered.value.map((w) => ({
    ...w,
    gapDays: gapDaysById.value.get(w.id) ?? null,
  }))

  const map = new Map<string, WorkoutListRow[]>()
  for (const w of rows) {
    const key = dayjs(w.date).format('YYYY-MM')
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(w)
  }

  return [...map.entries()].map(([key, workouts]) => ({
    key,
    label: capitalize(dayjs(key + '-01').format('MMMM YYYY')),
    workouts,
  }))
})

const { collapsed, toggleMonth, collapseAllButFirst, expandAll, allCollapsedButFirst } =
  useCollapsedMonths(groups)

// ─── Подозрение на дубликат: одинаковый состав упражнений и подходов ───
function workoutSignature(w: Workout): string | null {
  const entries = w.entries || []
  if (!entries.length) return null
  return entries
    .map((e) => `${e.exerciseId}:${(e.sets || []).map((s) => `${s.weight}x${s.reps}`).join(',')}`)
    .sort()
    .join('|')
}

const duplicatesOf = computed(() => {
  const bySig = new Map<string, number[]>()
  for (const w of workoutStore.workouts) {
    const sig = workoutSignature(w)
    if (!sig) continue
    if (!bySig.has(sig)) bySig.set(sig, [])
    bySig.get(sig)!.push(w.id)
  }
  const res = new Map<number, number[]>()
  for (const ids of bySig.values()) {
    if (ids.length < 2) continue
    for (const id of ids) res.set(id, ids.filter((x) => x !== id))
  }
  return res
})

function duplicate(workoutId: number) {
  router.push({ name: 'new-workout', query: { from: workoutId } })
}

async function remove(id: number) {
  if (!confirm('Удалить тренировку #' + id + '?')) return
  await deleteWorkout(id)
  await workoutStore.load()
  if (activeId.value === id) router.push('/')
}

async function doExport() {
  const data = await exportAll()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `gym-plus-export-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(url)
}

async function doImport() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async () => {
    const file = input.files?.[0]
    if (!file) return
    try {
      const data = JSON.parse(await file.text())
      if (!Array.isArray(data.workouts)) throw new Error('в файле нет массива workouts')
      const count = data.workouts.length
      if (!confirm(`Импортировать ${count} тренировок? Текущие данные будут заменены.`)) return
      await importAll(data)
      await catalogStore.load()
      await workoutStore.load()
    } catch (e) {
      alert('Импорт не выполнен: ' + (e instanceof Error ? e.message : String(e)))
    }
  }
  input.click()
}
</script>

<template>
  <div class="list-view">
    <!-- Поиск + кнопки -->
    <div class="top-bar">
      <input v-model="search" placeholder="Поиск..." class="search-input" />
    </div>
    <div class="actions-bar">
      <button class="btn btn-primary btn-new" @click="router.push({ name: 'new-workout' })">
        <Plus class="size-4" /> Тренировка
      </button>
      <Tooltip>
        <TooltipTrigger as-child>
          <button class="btn btn-sm" @click="doExport"><Download class="size-4" /></button>
        </TooltipTrigger>
        <TooltipContent>Экспорт в файл</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <button class="btn btn-sm" @click="doImport"><Upload class="size-4" /></button>
        </TooltipTrigger>
        <TooltipContent>Импорт из файла</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as-child>
          <button
            class="btn btn-sm"
            @click="allCollapsedButFirst ? expandAll() : collapseAllButFirst()"
          >
            <ChevronsDownUp class="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {{ allCollapsedButFirst ? 'Развернуть все месяцы' : 'Свернуть все месяцы, кроме текущего' }}
        </TooltipContent>
      </Tooltip>
    </div>

    <div v-if="filtered.length === 0" class="empty">
      {{ search ? 'Ничего не найдено' : 'Нет тренировок' }}
    </div>

    <div class="table-wrap" v-else>
      <table class="wt">
        <thead>
          <tr>
            <th class="th-id">#</th>
            <th class="th-date">Дата</th>
            <th class="th-mg">Мышцы</th>
            <th class="th-ex">Упр.</th>
            <th class="th-act"></th>
          </tr>
        </thead>
        <tbody v-for="g in groups" :key="g.key">
          <tr class="month-row" @click="toggleMonth(g.key)">
            <td colspan="5" class="month-cell">
              <ChevronDown class="size-3 month-chevron" :class="{ 'month-chevron-collapsed': collapsed.has(g.key) }" />
              <span class="month-label">{{ g.label }}</span>
              <span class="month-count">{{ g.workouts.length }}</span>
            </td>
          </tr>
          <template v-if="!collapsed.has(g.key)">
            <WorkoutRow
              v-for="w in g.workouts"
              :key="w.id"
              :workout="w"
              :active="w.id === activeId"
              :duplicates="duplicatesOf.get(w.id)"
              @edit="router.push({ name: 'edit-workout', params: { id: w.id } })"
              @duplicate="duplicate(w.id)"
              @remove="remove(w.id)"
            />
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.list-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  padding: 10px;
  container-type: inline-size;
}

.top-bar {
  margin-bottom: 6px;
  flex-shrink: 0;
}

.search-input {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid #444;
  border-radius: 6px;
  background: #1a1a1a;
  color: #eee;
  font-size: 0.9rem;
  box-sizing: border-box;
}

.actions-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 10px;
  flex-shrink: 0;
}

.btn-new {
  flex: 1;
}

.empty {
  text-align: center;
  color: #555;
  padding: 30px 0;
  font-size: 0.85rem;
}

.table-wrap {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.wt {
  /* Ширина у всех колонок: остаток делится пропорционально, а не
     собирается пустотой в одной */
  width: 100%;
  table-layout: fixed;
  border-collapse: collapse;
  font-size: 0.8rem;
}

/* Ширины задаёт шапка (table-layout: fixed); мышцы — под три бейджа */
.th-id { width: 38px; } .th-date { width: 80px; }
.th-mg { width: 72px; } .th-ex, .th-act { width: 46px; }

.month-row {
  cursor: pointer;
}

.month-row:hover .month-label {
  color: #aaa;
}

.month-row td {
  padding: 10px 4px 8px;
  border-bottom: 1px solid #222;
}

.month-chevron {
  /* SVG lucide — display:block, иначе переносится на свою строку */
  display: inline-block;
  vertical-align: -2px;
  color: #555;
  margin-right: 4px;
  transition: transform 0.15s ease;
}

.month-chevron-collapsed {
  transform: rotate(-90deg);
}

.month-label {
  font-size: 0.68rem;
  font-weight: 700;
  color: #777;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  white-space: nowrap;
}

.month-count {
  margin-left: 6px;
  font-size: 0.65rem;
  color: #444;
}

.wt thead th {
  position: sticky;
  top: 0;
  background: #161616;
  color: #555;
  font-weight: 600;
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 4px 4px 6px;
  border-bottom: 1px solid #2a2a2a;
  white-space: nowrap;
}

/* Идёт после .month-row td намеренно: как в исходнике, padding 5px 4px побеждает */
.wt td {
  padding: 5px 4px;
  vertical-align: middle;
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
  white-space: nowrap;
}

.btn:hover {
  background: #333;
}

.btn-primary {
  background: #2a7a4a;
  border-color: #2a7a4a;
  color: #fff;
}

.btn-primary:hover {
  background: #3a8a5a;
}

.btn-sm {
  padding: 6px 10px;
  font-size: 0.85rem;
}
</style>
