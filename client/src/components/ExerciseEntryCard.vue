<script setup lang="ts">
import { watch } from 'vue'
import type { ExerciseEntry, SetRow } from '@/types'
import ExerciseSelector from './ExerciseSelector.vue'
import SetsGrid from './SetsGrid.vue'
import PhotoAttach from './PhotoAttach.vue'
import { useWorkoutStore } from '@/stores/workoutStore'
import { Trash2 } from 'lucide-vue-next'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

const props = defineProps<{
  entry: ExerciseEntry
  muscleGroups: string[]
  supersetLabel?: string
  index?: number
}>()
const emit = defineEmits<{
  update: [entry: ExerciseEntry]
  remove: []
}>()

const workoutStore = useWorkoutStore()

// Авто-заполнение из последней тренировки при выборе упражнения
watch(() => props.entry.exerciseId, (newId) => {
  if (!newId) return
  // Дефолтный сет {reps: 15, weight: 0} тоже пустой — проверяем только вес
  const allEmpty = props.entry.sets.every(s => !s.weight)
  if (!allEmpty) return // уже заполнено — не перезаписываем
  for (const w of workoutStore.workouts) {
    const found = w.entries?.find((e: ExerciseEntry) => e.exerciseId === newId)
    if (found?.sets?.length) {
      emit('update', { ...props.entry, sets: found.sets.map((s: SetRow) => ({ ...s })) })
      return
    }
  }
})

function updateSets(sets: SetRow[]) { emit('update', { ...props.entry, sets }) }
function updateExercise(id: string) { emit('update', { ...props.entry, exerciseId: id }) }
function setBarWeight(w: number) {
  const cur = props.entry.barWeight ?? 0
  emit('update', { ...props.entry, barWeight: cur === w ? 0 : w })
}
function updateDescription(val: string) { emit('update', { ...props.entry, description: val || undefined }) }
function updatePhotos(ids: string[]) { emit('update', { ...props.entry, photoIds: ids.length ? ids : undefined }) }

</script>

<template>
  <div class="entry-card" :class="{ 'in-superset': supersetLabel }">

    <!-- Заголовок -->
    <div class="entry-header">
      <span v-if="index !== undefined" class="entry-num">{{ index + 1 }}.</span>
      <div class="ex-selector-wrap">
        <ExerciseSelector
          :modelValue="entry.exerciseId"
          @update:modelValue="updateExercise"
          :muscleGroups="muscleGroups"
        />
      </div>
      <span v-if="supersetLabel" class="superset-badge">{{ supersetLabel }}</span>

      <!-- Заметка -->
      <input
        :value="entry.description || ''"
        @input="updateDescription(($event.target as HTMLInputElement).value)"
        placeholder="Заметка..."
        class="note-input"
      />

      <!-- Фото -->
      <PhotoAttach :photoIds="entry.photoIds || []" @update="updatePhotos" />

      <!-- Вес штанги -->
      <div class="bar-row">
        <span class="bar-label">Штанга:</span>
        <button v-for="w in [12, 20]" :key="w" class="bar-btn"
          :class="{ active: entry.barWeight === w }" @click="setBarWeight(w)">{{ w }}</button>
      </div>

      <Tooltip>
        <TooltipTrigger as-child>
          <button class="remove-entry" @click="emit('remove')"><Trash2 class="size-4" /></button>
        </TooltipTrigger>
        <TooltipContent>Удалить упражнение</TooltipContent>
      </Tooltip>
    </div>

    <!-- Таблица подходов -->
    <SetsGrid
      :sets="entry.sets"
      :exerciseId="entry.exerciseId"
      :barWeight="entry.barWeight ?? 0"
      @update:sets="updateSets"
    />
  </div>
</template>

<style scoped>
.entry-card {
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 7px 10px;
  margin-bottom: 6px;
}

.in-superset { border-left: 3px solid #5a8; }

.entry-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.entry-num {
  font-size: 0.8rem;
  font-weight: bold;
  color: #5a8;
  flex-shrink: 0;
  min-width: 18px;
}

.ex-selector-wrap { flex: 2; min-width: 200px; }

.superset-badge {
  font-size: 0.7rem;
  color: #5a8;
  font-weight: bold;
  white-space: nowrap;
}

.remove-entry {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #555;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: color 0.1s, background 0.1s;
}
.remove-entry:hover { color: #d55; background: #2a1a1a; }

/* Штанга — компактный блок в шапке */
.bar-row {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-left: auto;
  flex-shrink: 0;
}
.bar-label { font-size: 0.7rem; color: #666; }
.bar-btn {
  padding: 1px 7px;
  border: 1px solid #444;
  border-radius: 4px;
  background: transparent;
  color: #888;
  cursor: pointer;
  font-size: 0.72rem;
  line-height: 1.3;
}
.bar-btn:hover { border-color: #888; color: #ccc; }
.bar-btn.active { border-color: #c8a; background: #3a2a1a; color: #c8a; }

/* Заметка в шапке */
.note-input {
  flex: 1;
  min-width: 100px;
  padding: 4px 8px;
  border: 1px solid #333;
  border-radius: 4px;
  background: #151515;
  color: #ccc;
  font-size: 0.8rem;
}
</style>
