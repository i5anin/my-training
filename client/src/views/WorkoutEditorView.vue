<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { nanoid } from 'nanoid'
import type { Workout, SetRow } from '@/types'
import { getWorkout, getNextWorkoutId, saveWorkout } from '@/db'
import { useWorkoutStore } from '@/stores/workoutStore'
import { useEditTiming } from '@/composables/useEditTiming'
import MuscleGroupPhotos from '@/components/MuscleGroupPhotos.vue'
import MiniMonthCalendar from '@/components/MiniMonthCalendar.vue'
import WorkoutFormHeader from '@/components/WorkoutFormHeader.vue'
import WorkoutReadView from '@/components/WorkoutReadView.vue'
import WorkoutEntryList from '@/components/WorkoutEntryList.vue'
import { Pencil, Save } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const workoutStore = useWorkoutStore()

const loading = ref(false)
const saving = ref(false)

// Режим: существующие тренировки открываются на просмотр,
// правка — только после явного «Редактировать»; новые — сразу в правке
const editMode = ref(false)

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

// Учёт времени редактирования — тренировки целиком и каждого упражнения
const {
  startWorkoutSession,
  finalizeWorkoutTime,
  startEntrySession,
  finalizeEntryTimes,
} = useEditTiming(workout)

// Снапшот последнего сохранённого состояния — автосейв пишет только при изменениях
let savedSnapshot = ''
// Группы сверх первых двух (legacy-данные) — не теряем их при syncMuscleGroups
let legacyTail: string[] = []
// Токен против гонки: при быстром переключении тренировок побеждает последний запрос
let loadSeq = 0

async function loadWorkout() {
  const seq = ++loadSeq
  loading.value = true
  legacyTail = []
  editMode.value = route.name !== 'edit-workout'
  try {
    if (route.name === 'edit-workout') {
      // Старые данные не сбрасываем: контент виден, пока грузится
      // следующая тренировка — переключение не моргает
      const id = Number(route.params.id)
      const existing = await getWorkout(id)
      if (seq !== loadSeq) return
      if (existing) {
        workout.value = JSON.parse(JSON.stringify(existing))
        // Совместимость: если старые данные без primaryType — берём из muscleGroups
        if (!workout.value.primaryType && workout.value.muscleGroups.length > 0) {
          workout.value.primaryType = workout.value.muscleGroups[0]
        }
        if (!workout.value.secondaryType && workout.value.muscleGroups.length > 1) {
          workout.value.secondaryType = workout.value.muscleGroups[1]
        }
        legacyTail = workout.value.muscleGroups.slice(2)
      } else {
        router.replace('/')
      }
    } else {
      workout.value = emptyWorkout()
      workout.value.id = await getNextWorkoutId()
      if (seq !== loadSeq) return
      const fromId = Number(route.query.from)
      if (fromId) {
        const source = await getWorkout(fromId)
        if (seq !== loadSeq) return
        if (source) {
          workout.value.primaryType = source.primaryType || source.muscleGroups[0] || ''
          workout.value.secondaryType = source.secondaryType || source.muscleGroups[1] || ''
          workout.value.entries = source.entries.map((e) => ({
            ...e,
            id: nanoid(),
            sets: e.sets.map((s) => ({ ...s })),
            photoIds: undefined,
            description: undefined,
            createdAt: new Date().toISOString(),
            totalEditMs: 0,
          }))
        }
      }
    }
    syncMuscleGroups()
  } finally {
    if (seq === loadSeq) loading.value = false
  }
  if (seq !== loadSeq) return
  workout.value.entries.forEach((e) => startEntrySession(e.id))
  startWorkoutSession()
  savedSnapshot = JSON.stringify(workout.value)
}

watch(() => [route.name, route.params.id], loadWorkout, { immediate: true })

// Синхронизируем массив muscleGroups из двух селектов;
// группы сверх двух (legacy) сохраняем, а не молча стираем
function syncMuscleGroups() {
  const groups: string[] = []
  if (workout.value.primaryType) groups.push(workout.value.primaryType)
  if (workout.value.secondaryType && workout.value.secondaryType !== workout.value.primaryType) {
    groups.push(workout.value.secondaryType)
  }
  for (const g of legacyTail) {
    if (!groups.includes(g)) groups.push(g)
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

async function save() {
  if (saving.value || !editMode.value) return
  // Невалидный номер (пустое поле, дробь) — не пишем в базу
  const id = workout.value.id
  if (!Number.isInteger(id) || id < 1) return
  saving.value = true
  finalizeWorkoutTime()
  finalizeEntryTimes()
  try {
    const wasNew = isNew.value
    await saveWorkout(JSON.parse(JSON.stringify(workout.value)))
    savedSnapshot = JSON.stringify(workout.value)
    await workoutStore.load()
    // Сохранили — возвращаемся в просмотр
    editMode.value = false
    // Новая тренировка сохранена — переходим на её постоянный маршрут
    if (wasNew) {
      router.replace({ name: 'edit-workout', params: { id: workout.value.id } })
    }
  } finally {
    saving.value = false
  }
}

// Выход из редактирования без сохранения: откат к последнему снапшоту
function cancelEdit() {
  if (isNew.value) {
    router.push({ name: 'list' })
    return
  }
  if (savedSnapshot) workout.value = JSON.parse(savedSnapshot)
  editMode.value = false
}

// Ctrl+S — по физической клавише, работает и на русской раскладке
function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.code === 'KeyS') {
    e.preventDefault()
    save()
  }
}

// Авто-сохранение каждые 30 сек — только если есть несохранённые изменения
let autoSaveTimer: ReturnType<typeof setInterval>
onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  autoSaveTimer = setInterval(() => {
    if (loading.value || !editMode.value || workout.value.entries.length === 0) return
    if (JSON.stringify(workout.value) === savedSnapshot) return
    save()
  }, 30_000)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKeydown)
  clearInterval(autoSaveTimer)
})
</script>

<template>
  <!-- Пока грузится следующая тренировка — показываем предыдущую (без моргания) -->
  <div class="editor-layout" v-if="!loading || workout.id > 0">

    <!-- Левая колонка: просмотр — таблица как на бумажном бланке,
         редактирование — форма с инпутами -->
    <div class="col-main">
      <template v-if="editMode">
        <WorkoutFormHeader
          :isNew="isNew"
          v-model:id="workout.id"
          v-model:date="workout.date"
          v-model:primaryType="workout.primaryType"
          v-model:secondaryType="workout.secondaryType"
          v-model:description="workout.description"
          v-model:photoIds="workout.photoIds"
        />

        <!-- Упражнения -->
        <WorkoutEntryList
          v-model:entries="workout.entries"
          :muscleGroups="workout.muscleGroups"
        />

        <div class="add-buttons">
          <button class="btn" @click="addEntry">+ Упражнение</button>
          <button class="btn" @click="addSuperset">+ Суперсет</button>
        </div>
      </template>

      <WorkoutReadView v-else :workout="workout" />
    </div>

    <!-- Правая колонка: мини-календарь + фото мышц (sticky) -->
    <div class="col-photos">
      <MiniMonthCalendar />
      <MuscleGroupPhotos
        :primaryType="workout.primaryType || ''"
        :secondaryType="workout.secondaryType || ''"
      />
    </div>

  </div>

  <div class="save-bar" v-if="!loading || workout.id > 0">
    <button v-if="!editMode" class="btn btn-save btn-edit" @click="editMode = true">
      <Pencil class="size-4" />
      Редактировать
    </button>
    <template v-else>
      <div class="save-actions">
        <button class="btn btn-cancel" @click="cancelEdit" :disabled="saving">Отмена</button>
        <button class="btn btn-save" @click="save" :disabled="saving">
          <Save v-if="!saving" class="size-4" />
          {{ saving ? 'Сохраняю...' : 'Сохранить' }}
        </button>
      </div>
    </template>
  </div>

  <div class="loading" v-else>Загрузка...</div>
</template>

<style scoped>
.editor-layout {
  container-type: inline-size;
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.col-main {
  flex: 1;
  min-width: 0;
}

/* Фото справа только когда панель шире 560px */
.col-photos {
  display: none;
  flex-direction: column;
  gap: 12px;
  width: 220px;
  flex-shrink: 0;
  position: sticky;
  top: 0;
}

@container (min-width: 560px) {
  .col-photos {
    display: flex;
  }
}

.loading {
  color: #666;
  padding: 40px;
  text-align: center;
}

.save-actions {
  display: flex;
  gap: 8px;
}

.save-actions .btn-save {
  flex: 1;
}

.btn-cancel {
  padding: 11px 22px;
  background: #252525;
  border: 1px solid #444;
  border-radius: 6px;
  color: #aaa;
  font-size: 1rem;
  cursor: pointer;
}

.btn-cancel:hover {
  background: #333;
}

/* Кнопка «Редактировать» — отличается от зелёного «Сохранить» */
.btn-edit {
  background: #2a4a6a;
}

.btn-edit:hover {
  background: #3a5a7a;
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

.add-buttons {
  display: flex;
  gap: 8px;
}

/* Липнет к низу прокручиваемой панели — ширина панели любая,
   в отличие от прежнего position: fixed с жёстким left: 320px.
   Панель без нижнего паддинга, поэтому отрицательный маргин не нужен */
.save-bar {
  position: sticky;
  bottom: 0;
  /* auto — прижимает бар к низу панели, когда контента мало */
  margin: 12px -16px 0;
  margin-top: auto;
  padding: 10px 16px;
  background: #121212;
  border-top: 1px solid #2a2a2a;
  z-index: 50;
}

.btn-save {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
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
