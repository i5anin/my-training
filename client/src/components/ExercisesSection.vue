<script setup lang="ts">
import { computed, ref } from 'vue'
import { useCatalogStore } from '@/stores/catalogStore'
import { Pencil, X, Plus } from 'lucide-vue-next'
import { useCatalogSections } from '@/composables/catalogSections'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { isBigThree } from '@/composables/bigThree'
import { plural, slug } from '@/composables/textFormat'
import { useCatalogUsage } from '@/composables/useCatalogUsage'
import { useMuscleInvolvement } from '@/composables/muscleInvolvement'
import ExerciseTags from '@/components/ExerciseTags.vue'
import CatalogSectionHead from '@/components/CatalogSectionHead.vue'
import ExerciseEditDialog from '@/components/ExerciseEditDialog.vue'
import type { Exercise } from '@/types'

const catalogStore = useCatalogStore()
const { exerciseUsage } = useCatalogUsage()
const { weakOf, hint: involvementHint } = useMuscleInvolvement()

// ─── Добавление ─────────────────────────────────────────
const newExName = ref('')
const newExMgs = ref<string[]>([])

async function addEx() {
  const name = newExName.value.trim()
  if (!name || newExMgs.value.length === 0) return
  const id = slug(name)
  if (!id) {
    alert('Название не содержит допустимых символов')
    return
  }
  if (catalogStore.exercises.some((e) => e.id === id)) {
    alert('Упражнение с таким именем уже существует')
    return
  }
  await catalogStore.addExercise({ id, name, muscleGroups: [...newExMgs.value] })
  newExName.value = ''
  newExMgs.value = []
}

// ─── Поиск и фильтр ─────────────────────────────────────
const exSearch = ref('')
const exFilterMg = ref('all')

const filteredExercises = computed(() => {
  const q = exSearch.value.trim().toLowerCase()
  return [...catalogStore.exercises]
    .filter((e) => exFilterMg.value === 'all'
      || e.muscleGroups.includes(exFilterMg.value)
      || weakOf(e).includes(exFilterMg.value))
    .filter((e) => !q || e.name.toLowerCase().includes(q) || e.id.toLowerCase().includes(q))
    .sort((a, b) => (exerciseUsage.value.get(b.id) ?? 0) - (exerciseUsage.value.get(a.id) ?? 0)
                 || a.name.localeCompare(b.name))
})

// ─── Группировка по семьям и подгруппам мышц ────────────
/** При поиске секции раскрыты — иначе совпадения не видно */
const searching = computed(() => exSearch.value.trim().length > 0)

const { sections, toggle: toggleFamily, isOpen } = useCatalogSections(
  filteredExercises,
  computed(() => catalogStore.muscleGroups),
  searching,
)

// ─── Редактирование и удаление ──────────────────────────
async function deleteEx(ex: Exercise) {
  const used = exerciseUsage.value.get(ex.id) ?? 0
  const times = `${used} ${plural(used, 'тренировке', 'тренировках')}`
  const msg = used > 0
    ? `Упражнение "${ex.name}" использовано в ${times}. Удалить?`
    : `Удалить "${ex.name}"?`
  if (!confirm(msg)) return
  await catalogStore.removeExercise(ex.id)
}

const editing = ref<Exercise | null>(null)
</script>

<template>
  <div class="ex-tab">
    <!-- Добавить -->
    <div class="add-form">
      <input
        v-model="newExName"
        placeholder="Новое упражнение..."
        class="add-input"
        @keydown.enter="addEx"
      />
      <button class="btn-add" @click="addEx" :disabled="!newExName.trim() || newExMgs.length === 0"><Plus class="size-4" /></button>
    </div>
    <div class="add-mgs">
      <button
        v-for="mg in catalogStore.muscleGroups" :key="mg.id"
        class="mg-pill" :class="{ active: newExMgs.includes(mg.id) }"
        @click="newExMgs.includes(mg.id)
          ? newExMgs = newExMgs.filter(x => x !== mg.id)
          : newExMgs.push(mg.id)"
      ><MgIcon :id="mg.id" :size="14" /> {{ mg.label }}</button>
    </div>

    <!-- Поиск / фильтр -->
    <div class="filter-row">
      <input v-model="exSearch" placeholder="Поиск..." class="filter-input" />
      <select v-model="exFilterMg" class="filter-select">
        <option value="all">Все группы</option>
        <option v-for="mg in catalogStore.muscleGroups" :key="mg.id" :value="mg.id">
          {{ mg.label }}
        </option>
      </select>
    </div>

    <!-- Список по семьям мышц -->
    <div class="ex-list">
      <template v-for="sec in sections" :key="sec.id">
        <CatalogSectionHead
          :group-id="sec.id" :label="sec.label" :count="sec.count"
          :open="isOpen(sec.id)" :level="1"
          @toggle="toggleFamily(sec.id)"
        />

        <template v-for="grp in (isOpen(sec.id) ? sec.groups : [])" :key="grp.key">
          <!-- Подгруппа: бицепс/трицепс у рук, широчайшие у спины -->
          <CatalogSectionHead
            v-if="grp.label"
            :group-id="grp.id" :label="grp.label" :count="grp.exercises.length"
            :open="isOpen(grp.key)" :level="2"
            @toggle="toggleFamily(grp.key)"
          />

          <div v-for="ex in (grp.label && !isOpen(grp.key) ? [] : grp.exercises)" :key="ex.id"
            class="ex-item"
            :class="{ 'big-three': isBigThree(ex.id), nested: !!grp.label }">
        <div class="ex-row">
          <span class="ex-name">{{ ex.name }}</span>
          <Tooltip>
            <TooltipTrigger as-child>
              <span class="ex-mgs"><ExerciseTags :exercise-id="ex.id" /></span>
            </TooltipTrigger>
            <TooltipContent>{{ involvementHint(ex) }}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <span class="ex-usage">{{ exerciseUsage.get(ex.id) ?? 0 }}×</span>
            </TooltipTrigger>
            <TooltipContent>Использований: {{ exerciseUsage.get(ex.id) ?? 0 }}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <button class="icon-btn" @click="editing = ex"><Pencil class="size-3.5" /></button>
            </TooltipTrigger>
            <TooltipContent>Редактировать</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger as-child>
              <button class="icon-btn del-btn" @click="deleteEx(ex)"><X class="size-3.5" /></button>
            </TooltipTrigger>
            <TooltipContent>Удалить</TooltipContent>
          </Tooltip>
        </div>
          </div>
        </template>
      </template>
      <div v-if="!filteredExercises.length" class="empty">Ничего не найдено</div>
    </div>

    <ExerciseEditDialog v-if="editing" :exercise="editing" @close="editing = null" />
  </div>
</template>

<style scoped>
/* ── Форма добавления ── */
.add-form {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}
.add-input {
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  background: #111;
  color: #eee;
  font-size: 0.85rem;
}
.add-input:focus { outline: none; border-color: #5a8; }
.btn-add {
  padding: 0 14px;
  border: 1px solid #2a7a4a;
  border-radius: 6px;
  background: #1a3a2a;
  color: #5a8;
  cursor: pointer;
  font-size: 1rem;
  font-weight: bold;
}
.btn-add:hover:not(:disabled) { background: #2a5a3a; }
.btn-add:disabled { opacity: 0.3; cursor: not-allowed; }

.add-mgs {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
}

/* ── Фильтр ── */
.filter-row {
  display: flex;
  gap: 5px;
  flex-shrink: 0;
}
.filter-input {
  flex: 1;
  padding: 5px 8px;
  border: 1px solid #2a2a2a;
  border-radius: 5px;
  background: #111;
  color: #eee;
  font-size: 0.8rem;
}
.filter-select {
  padding: 5px 8px;
  border: 1px solid #2a2a2a;
  border-radius: 5px;
  background: #111;
  color: #ccc;
  font-size: 0.8rem;
  max-width: 110px;
}

/* ── Список упражнений ── */
.ex-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ex-item {
  border-radius: 6px;
  background: #161616;
  border: 1px solid #1f1f1f;
  overflow: hidden;
}
.ex-item:hover { background: #1a1a1a; }
/* Колонки одной ширины во всех строках: название тянется,
   метки и счётчик стоят строго друг под другом */
.ex-row {
  display: grid;
  grid-template-columns: minmax(90px, 1fr) minmax(0, 470px) 34px 22px 22px;
  align-items: center;
  gap: 10px;
  padding: 7px 10px;
}

.ex-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #eee;
  font-size: 0.85rem;
}

.ex-mgs {
  display: block;
  min-width: 0;
}

/* ── Заголовок семьи мышц ── */
/* ── Pill для группы мышц ── */
.mg-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px 3px 5px;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  background: #1a1a1a;
  color: #888;
  cursor: pointer;
  font-size: 0.72rem;
  white-space: nowrap;
}
.mg-pill:hover { border-color: #5a8; color: #5a8; }
.mg-pill.active { border-color: #d4635c; background: #2a1a1a; color: #d4635c; }
/* ── Удалить ── */
.del-btn {
  background: none;
  border: none;
  color: #444;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 2px 4px;
  flex-shrink: 0;
}
.del-btn:hover { color: #a55; }

.empty {
  text-align: center;
  color: #444;
  padding: 20px 0;
  font-size: 0.85rem;
}
</style>
