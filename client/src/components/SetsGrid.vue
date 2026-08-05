<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import type { SetRow } from '@/types'
import SetCell from './SetCell.vue'
import { CornerDownRight, Plus } from 'lucide-vue-next'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

const props = defineProps<{
  sets: SetRow[]
  exerciseId: string
  barWeight: number
}>()
const emit = defineEmits<{
  'update:sets': [sets: SetRow[]]
}>()

// Корень таблицы — поиск input для фокуса ведётся внутри него, а не по всему документу
const rootEl = ref<HTMLElement | null>(null)

// Группируем подходы: каждый столбец = основной сет + N добивок после него
interface BurnoutEntry { set: SetRow; idx: number }
interface SetCol {
  main: SetRow
  mainIdx: number
  burnouts: BurnoutEntry[]
}

const setColumns = computed<SetCol[]>(() => {
  const cols: SetCol[] = []
  const sets = props.sets
  let i = 0
  while (i < sets.length) {
    const s = sets[i]
    if (!s) break
    if (!s.isBurnout) {
      const col: SetCol = { main: s, mainIdx: i, burnouts: [] }
      i++
      for (let b = sets[i]; b?.isBurnout; b = sets[i]) {
        col.burnouts.push({ set: b, idx: i })
        i++
      }
      cols.push(col)
    } else {
      cols.push({ main: s, mainIdx: i, burnouts: [] })
      i++
    }
  }
  return cols
})

const maxBurnouts = computed(() => Math.max(0, ...setColumns.value.map(c => c.burnouts.length)))

function updateSet(index: number, set: SetRow) {
  const sets = [...props.sets]
  sets[index] = set
  emit('update:sets', sets)
}

function removeSet(index: number) {
  emit('update:sets', props.sets.filter((_, i) => i !== index))
}

function addSet() {
  const last = props.sets.filter(s => !s.isBurnout).at(-1)
  const newSet: SetRow = last ? { reps: last.reps, weight: last.weight } : { reps: 15, weight: 0 }
  emit('update:sets', [...props.sets, newSet])
}

// Enter в последнем set → добавляем новый подход с теми же значениями
function onNextSet(colIdx: number) {
  const col = setColumns.value[colIdx]
  if (!col) return
  const newSet: SetRow = { reps: col.main.reps, weight: col.main.weight }
  const newSets = [...props.sets, newSet]
  emit('update:sets', newSets)
  // Фокус на новый подход после рендера
  nextTick(() => {
    const lastIdx = newSets.length - 1
    const cellEl = rootEl.value?.querySelector<HTMLInputElement>(
      `[data-set-idx="${lastIdx}"] input[type=number]`
    )
    cellEl?.focus(); cellEl?.select()
  })
}

function toggleWarmupCol(colIdx: number) {
  const col = setColumns.value[colIdx]
  if (!col) return
  const sets = [...props.sets]
  const main = sets[col.mainIdx]
  if (!main) return
  const willBeWarmup = !main.isWarmup

  // Индексы колонки (основной + добивки), по возрастанию
  const indices = [col.mainIdx, ...col.burnouts.map((b) => b.idx)].sort((a, b) => a - b)

  // Вырезаем колонку, помечая isWarmup
  const extracted: SetRow[] = []
  for (const idx of indices) {
    const s = sets[idx]
    if (s) extracted.push({ ...s, isWarmup: willBeWarmup })
  }
  for (let i = indices.length - 1; i >= 0; i--) {
    const idx = indices[i]
    if (idx !== undefined) sets.splice(idx, 1)
  }

  // Вставляем сразу после последней разминки —
  // делает колонку либо последней разминкой, либо первой рабочей
  let insertAt = 0
  for (let i = 0; i < sets.length; i++) {
    if (sets[i]?.isWarmup) insertAt = i + 1
  }
  sets.splice(insertAt, 0, ...extracted)

  emit('update:sets', sets)
}

function addBurnoutToCol(colIdx: number) {
  const col = setColumns.value[colIdx]
  if (!col) return
  // Вставляем после последней добивки этого столбца (или после основного, если добивок нет)
  const anchor = col.burnouts.at(-1) ?? { set: col.main, idx: col.mainIdx }
  const nb: SetRow = {
    reps: anchor.set.reps,
    weight: Math.round(anchor.set.weight * 0.7 * 2) / 2,
    isBurnout: true,
  }
  const sets = [...props.sets]
  sets.splice(anchor.idx + 1, 0, nb)
  emit('update:sets', sets)
}
</script>

<template>
  <div ref="rootEl" class="sets-wrap">
    <table class="sets-table">
      <tbody>
        <!-- Основные подходы: метка «Р/N» слева внутри ячейки -->
        <tr class="main-row">
          <td v-for="(col, ci) in setColumns" :key="ci" class="td-main" :data-set-idx="col.mainIdx">
            <div class="cell-with-label">
              <Tooltip>
                <TooltipTrigger as-child>
                  <button
                    class="col-toggle"
                    :class="{ 'is-warmup': col.main.isWarmup }"
                    @click="toggleWarmupCol(ci)"
                  >
                    {{ col.main.isWarmup ? 'Р' : ci + 1 - setColumns.slice(0, ci).filter(c => c.main.isWarmup).length }}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  {{ col.main.isWarmup ? 'Сделать рабочим' : 'Сделать разминкой' }}
                </TooltipContent>
              </Tooltip>
              <SetCell
                :modelValue="col.main"
                :exerciseId="exerciseId"
                :barWeight="barWeight"
                @update:modelValue="updateSet(col.mainIdx, $event)"
                @remove="removeSet(col.mainIdx)"
                @next-set="onNextSet(ci)"
              />
            </div>
          </td>
          <td class="td-add-col">
            <Tooltip>
              <TooltipTrigger as-child>
                <button class="add-col-btn" @click="addSet"><Plus class="size-4" /></button>
              </TooltipTrigger>
              <TooltipContent>Добавить подход</TooltipContent>
            </Tooltip>
          </td>
        </tr>

        <!-- Строки добивок -->
        <tr v-for="ri in maxBurnouts" :key="'b' + ri" class="burnout-row">
          <td v-for="(col, ci) in setColumns" :key="ci"
            class="td-burnout" :class="{ filled: !!col.burnouts[ri - 1] }">
            <!-- Данные добивки -->
            <SetCell
              v-if="col.burnouts[ri - 1]"
              :modelValue="col.burnouts[ri - 1]!.set"
              :exerciseId="exerciseId"
              :barWeight="barWeight"
              @update:modelValue="updateSet(col.burnouts[ri - 1]!.idx, $event)"
              @remove="removeSet(col.burnouts[ri - 1]!.idx)"
            />
            <!-- ↳ кнопка в пустой ячейке — сюда добавится добивка -->
            <button
              v-else-if="ri - 1 === col.burnouts.length"
              class="add-burnout-here td-hint"
              @click="addBurnoutToCol(ci)"><CornerDownRight class="size-3" /></button>
          </td>
          <td></td>
        </tr>
        <!-- Последняя строка: ↳ только для колонок, уже полностью заполненных -->
        <tr class="burnout-hint-row">
          <td v-for="(col, ci) in setColumns" :key="ci" class="td-burnout td-hint">
            <button
              v-if="col.burnouts.length === maxBurnouts"
              class="add-burnout-here"
              @click="addBurnoutToCol(ci)"><CornerDownRight class="size-3" /></button>
          </td>
          <td></td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.sets-wrap { margin-bottom: 4px; }

.sets-table {
  border-collapse: collapse;
  width: auto;
}

.cell-with-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.col-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 18px;
  padding: 0 6px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #5a8;
  font-size: 0.7rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.1s, border-color 0.1s, color 0.1s;
}
.col-toggle:hover {
  border-color: #2a4a3a;
  background: rgba(90, 170, 136, 0.08);
}
.col-toggle.is-warmup {
  color: #6ab4e8;
  border-color: #2a4a6a;
  background: rgba(74, 138, 184, 0.12);
}
.col-toggle.is-warmup:hover {
  background: rgba(74, 138, 184, 0.20);
}

.td-add-col { width: 32px; padding: 0 4px; vertical-align: middle; }

.add-col-btn {
  background: none;
  border: 1px dashed #3a3a3a;
  border-radius: 6px;
  color: #555;
  cursor: pointer;
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.1s, color 0.1s, background 0.1s;
}
.add-col-btn:hover {
  border-color: #5a8;
  color: #5a8;
  background: rgba(90, 170, 136, 0.08);
}

/* Основные ячейки */
.td-main {
  padding: 1px 3px;
  vertical-align: middle;
  white-space: nowrap;
}

/* Добивки: слева отступ 26px = ширина метки колонки (22px) + зазор (4px),
   чтобы инпуты добивки стояли ровно под инпутами основного подхода */
.td-burnout {
  padding: 1px 3px 1px 29px;
  vertical-align: middle;
  white-space: nowrap;
}

.td-burnout.filled {
  background: #1e1400;
  border-top: 1px solid #3a2a00;
}

/* Кнопки «↳ добавить добивку»: невидимы, пока курсор не над таблицей —
   иначе пустые пунктирные ряды выглядят как поехавшая вёрстка */
.add-burnout-here {
  background: none;
  border: 1px dashed #4a3a00;
  border-radius: 4px;
  color: #5a4a00;
  cursor: pointer;
  font-size: 0.75rem;
  padding: 1px 8px;
  width: auto;
  opacity: 0;
  transition: opacity 0.15s;
}
.sets-table:hover .add-burnout-here { opacity: 0.35; }
.sets-table .add-burnout-here:hover { opacity: 1; border-color: #c84; color: #c84; }

.td-hint { transition: opacity 0.15s; }
</style>
