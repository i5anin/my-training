<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { nanoid } from 'nanoid'
import type { Workout, ExerciseEntry, SetRow } from '@/types'
import { getWorkout, getNextWorkoutId, saveWorkout } from '@/db'
import { useCatalogStore } from '@/stores/catalogStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import ExerciseEntryCard from '@/components/ExerciseEntryCard.vue'
import MuscleGroupSelect from '@/components/MuscleGroupSelect.vue'
import MuscleGroupPhotos from '@/components/MuscleGroupPhotos.vue'
import PhotoAttach from '@/components/PhotoAttach.vue'
import { GripVertical, Save } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const catalogStore = useCatalogStore()
const workoutStore = useWorkoutStore()

const loading = ref(false)
const saving = ref(false)

const MAX_SESSION_MS = 5 * 60 * 1000
let workoutSessionStart = 0

function startWorkoutSession() {
  workoutSessionStart = Date.now()
}

function finalizeWorkoutTime() {
  if (!workoutSessionStart) return
  const elapsed = Math.min(Date.now() - workoutSessionStart, MAX_SESSION_MS)
  if (elapsed >= 2000) {
    workout.value.totalEditMs = (workout.value.totalEditMs ?? 0) + elapsed
  }
  workoutSessionStart = Date.now()
}

// keep per-entry session helpers for the badge in ExerciseEntryCard
const entrySessionStarts = new Map<string, number>()
function startEntrySession(id: string) { entrySessionStarts.set(id, Date.now()) }
function finalizeEntryTimes() {
  const now = Date.now()
  workout.value.entries = workout.value.entries.map((entry) => {
    const start = entrySessionStarts.get(entry.id)
    if (start == null) return entry
    const elapsed = Math.min(now - start, MAX_SESSION_MS)
    if (elapsed < 2000) return entry
    return { ...entry, totalEditMs: (entry.totalEditMs ?? 0) + elapsed }
  })
  workout.value.entries.forEach((e) => startEntrySession(e.id))
}

const isNew = computed(() => route.name === 'new-workout')

const emptyWorkout = (): Workout => ({
  id: 0,
  date: new Date().toISOString().slice(0, 10),
  muscleGroups: [],
  entries: [],
  description: '',
  photoIds: [],
  primaryType: '',
  secondaryType: '',
  createdAt: new Date().toISOString(),
  totalEditMs: 0,
})

const workout = ref<Workout>(emptyWorkout())

async function loadWorkout() {
  loading.value = true
  workout.value = emptyWorkout()
  try {
    if (route.name === 'edit-workout') {
      const id = Number(route.params.id)
      const existing = await getWorkout(id)
      if (existing) {
        workout.value = JSON.parse(JSON.stringify(existing))
        // Совместимость: если старые данные без primaryType — берём из muscleGroups
        if (!workout.value.primaryType && workout.value.muscleGroups.length > 0) {
          workout.value.primaryType = workout.value.muscleGroups[0]
        }
        if (!workout.value.secondaryType && workout.value.muscleGroups.length > 1) {
          workout.value.secondaryType = workout.value.muscleGroups[1]
        }
      } else {
        router.replace('/')
      }
    } else {
      workout.value.id = await getNextWorkoutId()
      const fromId = Number(route.query.from)
      if (fromId) {
        const source = await getWorkout(fromId)
        if (source) {
          workout.value.primaryType = source.primaryType || source.muscleGroups[0] || ''
          workout.value.secondaryType = source.secondaryType || source.muscleGroups[1] || ''
          workout.value.entries = source.entries.map((e) => ({
            ...e,
            id: nanoid(),
            sets: e.sets.map((s) => ({ ...s })),
            photoIds: undefined,
            description: undefined,
          }))
        }
      }
    }
    syncMuscleGroups()
  } finally {
    loading.value = false
  }
  workout.value.entries.forEach((e) => startEntrySession(e.id))
  startWorkoutSession()
}

watch(() => [route.name, route.params.id], loadWorkout, { immediate: true })

// Синхронизируем массив muscleGroups из двух селектов
function syncMuscleGroups() {
  const groups: string[] = []
  if (workout.value.primaryType) groups.push(workout.value.primaryType)
  if (workout.value.secondaryType && workout.value.secondaryType !== workout.value.primaryType) {
    groups.push(workout.value.secondaryType)
  }
  workout.value.muscleGroups = groups
}

watch(() => [workout.value.primaryType, workout.value.secondaryType], syncMuscleGroups)

function defaultSets(n = 4): SetRow[] {
  return Array.from({ length: n }, () => ({ reps: 15, weight: 0 }))
}

function addEntry() {
  const entry = {
    id: nanoid(),
    exerciseId: '',
    sets: defaultSets(4),
    createdAt: new Date().toISOString(),
    totalEditMs: 0,
  }
  workout.value.entries.push(entry)
  startEntrySession(entry.id)
}

function addSuperset() {
  const groupId = nanoid(8)
  const e1 = { id: nanoid(), exerciseId: '', sets: defaultSets(4), supersetGroupId: groupId, createdAt: new Date().toISOString(), totalEditMs: 0 }
  const e2 = { id: nanoid(), exerciseId: '', sets: defaultSets(4), supersetGroupId: groupId, createdAt: new Date().toISOString(), totalEditMs: 0 }
  workout.value.entries.push(e1, e2)
  startEntrySession(e1.id)
  startEntrySession(e2.id)
}

function updateEntry(index: number, entry: ExerciseEntry) {
  workout.value.entries[index] = entry
}

function removeEntry(index: number) {
  workout.value.entries.splice(index, 1)
}

// Drag-and-drop reorder
const dragSrc = ref<number | null>(null)
const dragOver = ref<number | null>(null)

function onDragStart(i: number, e: DragEvent) {
  dragSrc.value = i
  e.dataTransfer!.effectAllowed = 'move'
}

function onDragOver(i: number, e: DragEvent) {
  e.preventDefault()
  e.dataTransfer!.dropEffect = 'move'
  dragOver.value = i
}

function onDrop(i: number) {
  const src = dragSrc.value
  if (src == null || src === i) { dragSrc.value = null; dragOver.value = null; return }
  const entries = [...workout.value.entries]
  const [moved] = entries.splice(src, 1)
  entries.splice(i, 0, moved)
  workout.value.entries = entries
  dragSrc.value = null
  dragOver.value = null
}

function onDragEnd() {
  dragSrc.value = null
  dragOver.value = null
}

function getSupersetLabel(entry: ExerciseEntry): string | undefined {
  if (!entry.supersetGroupId) return undefined
  const groupEntries = workout.value.entries.filter((e) => e.supersetGroupId === entry.supersetGroupId)
  const pos = groupEntries.indexOf(entry) + 1
  return `Суперсет ${pos}/${groupEntries.length}`
}

async function save() {
  if (saving.value) return
  saving.value = true
  finalizeWorkoutTime()
  finalizeEntryTimes()
  try {
    await saveWorkout(JSON.parse(JSON.stringify(workout.value)))
    await workoutStore.load()
  } finally {
    saving.value = false
  }
}

// Ctrl+S
function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    save()
  }
}

// Авто-сохранение каждые 30 сек, если есть несохранённые упражнения
let autoSaveTimer: ReturnType<typeof setInterval>
onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  autoSaveTimer = setInterval(() => {
    if (!loading.value && workout.value.entries.length > 0) save()
  }, 30_000)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  clearInterval(autoSaveTimer)
})
</script>

<template>
  <div class="editor-layout" v-if="!loading">

    <!-- Левая колонка: форма + упражнения -->
    <div class="col-main">
      <div class="editor-top">
        <div class="id-heading">
          <span class="id-label">{{ isNew ? 'Новая тренировка' : 'Тренировка' }} #</span>
          <input
            type="number"
            class="id-input"
            v-model.number="workout.id"
            min="1"
            title="Номер тренировки"
          />
        </div>
      </div>

      <div class="form-grid">
        <!-- Дата -->
        <div class="field-row">
          <label>Дата</label>
          <input type="date" v-model="workout.date" class="date-input" />
        </div>

        <!-- Группы мышц -->
        <div class="field-row types-row">
          <MuscleGroupSelect
            :modelValue="workout.primaryType ?? ''"
            @update:modelValue="workout.primaryType = $event"
            label="Основная группа"
          />
          <MuscleGroupSelect
            :modelValue="workout.secondaryType ?? ''"
            @update:modelValue="workout.secondaryType = $event"
            label="Дополнительная группа"
            :disabledId="workout.primaryType ?? ''"
          />
        </div>

        <!-- Описание -->
        <div class="field-row">
          <input
            v-model="workout.description"
            placeholder="Описание тренировки..."
            class="desc-input"
          />
        </div>

        <!-- Фото тренировки -->
        <div class="field-row">
          <label>Фото</label>
          <PhotoAttach
            :photoIds="workout.photoIds || []"
            :thumbSize="64"
            @update="workout.photoIds = $event"
          />
        </div>
      </div>

      <!-- Упражнения -->
      <div class="entries">
        <div
          v-for="(entry, i) in workout.entries"
          :key="entry.id"
          class="entry-drag-wrap"
          :class="{
            'drag-src': dragSrc === i,
            'drag-over': dragOver === i && dragSrc !== i,
          }"
          draggable="true"
          @dragstart="onDragStart(i, $event)"
          @dragover="onDragOver(i, $event)"
          @drop="onDrop(i)"
          @dragend="onDragEnd"
        >
          <div class="drag-handle" title="Перетащить"><GripVertical class="size-4" /></div>
          <div class="entry-card-flex">
            <ExerciseEntryCard
              :entry="entry"
              :index="i"
              :muscleGroups="workout.muscleGroups"
              :supersetLabel="getSupersetLabel(entry)"
              @update="updateEntry(i, $event)"
              @remove="removeEntry(i)"
            />
          </div>
        </div>
      </div>

      <div class="add-buttons">
        <button class="btn" @click="addEntry">+ Упражнение</button>
        <button class="btn" @click="addSuperset">+ Суперсет</button>
      </div>
    </div>

    <!-- Правая колонка: фото мышц (sticky) -->
    <div class="col-photos">
      <MuscleGroupPhotos
        :primaryType="workout.primaryType || ''"
        :secondaryType="workout.secondaryType || ''"
      />
    </div>

  </div>

  <div class="save-bar" v-if="!loading">
    <button class="btn btn-save" @click="save" :disabled="saving">
      <Save v-if="!saving" class="size-4" />
      {{ saving ? 'Сохраняю...' : 'Сохранить' }}
    </button>
  </div>

  <div class="loading" v-else>Загрузка...</div>
</template>

<style scoped>
.editor-layout {
  container-type: inline-size;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  padding-bottom: 70px;
}

.col-main {
  flex: 1;
  min-width: 0;
}

/* Фото справа только когда панель шире 560px */
.col-photos {
  display: none;
  width: 150px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
}

@container (min-width: 560px) {
  .col-photos {
    display: block;
  }
}

.loading {
  color: #666;
  padding: 40px;
  text-align: center;
}

.editor-top {
  margin-bottom: 20px;
}

.id-heading {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 1.3rem;
  font-weight: bold;
}

.id-label {
  white-space: nowrap;
  color: #ccc;
}

.id-input {
  width: 72px;
  background: transparent;
  border: none;
  border-bottom: 1px dashed #555;
  color: #eee;
  font-size: 1.3rem;
  font-weight: bold;
  font-family: inherit;
  padding: 0 2px;
  -moz-appearance: textfield;
}

.id-input::-webkit-outer-spin-button,
.id-input::-webkit-inner-spin-button {
  -webkit-appearance: none;
}

.id-input:focus {
  outline: none;
  border-bottom-color: #5a8;
}

.form-grid {
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field-row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-row label {
  font-size: 0.78rem;
  color: #666;
}

.types-row {
  flex-direction: row;
  gap: 12px;
}

.date-input,
.desc-input {
  width: 100%;
  padding: 7px 10px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #111;
  color: #eee;
  font-size: 0.9rem;
  font-family: inherit;
}

.date-input:focus,
.desc-input:focus {
  outline: none;
  border-color: #5a8;
}

.date-input {
  width: auto;
}

.btn {
  padding: 8px 16px;
  border: 1px solid #444;
  border-radius: 6px;
  background: #2a2a2a;
  color: #eee;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn:hover {
  background: #333;
}

.btn-save {
  width: 100%;
  padding: 12px;
  margin-top: 16px;
  background: #2a7a4a;
  border-color: #2a7a4a;
  font-size: 1rem;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-save:hover {
  background: #3a8a5a;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: default;
}

.entries {
  margin: 0 0 12px;
}

.entry-drag-wrap {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  transition: opacity 0.15s;
}

.entry-drag-wrap.drag-src {
  opacity: 0.35;
}

.entry-drag-wrap.drag-over {
  outline: 2px solid #5a8;
  border-radius: 9px;
}

.drag-handle {
  flex-shrink: 0;
  font-size: 1.1rem;
  color: #444;
  cursor: grab;
  padding: 8px 2px 0;
  user-select: none;
  line-height: 1;
}

.drag-handle:hover {
  color: #888;
}

.entry-card-flex {
  flex: 1;
  min-width: 0;
}

.add-buttons {
  display: flex;
  gap: 8px;
}

.save-bar {
  position: fixed;
  bottom: 0;
  right: 0;
  left: 320px;
  padding: 10px 24px;
  background: #121212;
  border-top: 1px solid #2a2a2a;
  z-index: 50;
}

.btn-save {
  width: 100%;
  max-width: 720px;
  padding: 11px;
  background: #2a7a4a;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-size: 1rem;
  font-weight: bold;
  cursor: pointer;
}

.btn-save:hover {
  background: #3a8a5a;
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: default;
}
</style>
