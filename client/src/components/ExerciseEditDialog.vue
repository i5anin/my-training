<script setup lang="ts">
import { X } from 'lucide-vue-next'
import MgIcon from '@/components/MgIcon.vue'
import { useCatalogStore } from '@/stores/catalogStore'
import { useMuscleInvolvement, cycleInvolvement } from '@/composables/muscleInvolvement'
import type { Exercise } from '@/types'

/**
 * Редактирование упражнения: название, уровни мышц, вес грифа.
 * Раньше блок раскрывался прямо в списке и разъезжал строки — теперь
 * это модальное окно.
 */
const props = defineProps<{ exercise: Exercise }>()
const emit = defineEmits<{ close: [] }>()

const catalogStore = useCatalogStore()
const { weakOf } = useMuscleInvolvement()

async function rename(event: Event) {
  const input = event.target as HTMLInputElement
  const name = input.value.trim()
  if (!name || name === props.exercise.name) {
    input.value = props.exercise.name
    return
  }
  await catalogStore.addExercise({ ...props.exercise, name })
}

async function cycleGroup(mgId: string) {
  const next = cycleInvolvement(props.exercise, mgId)
  if (next) await catalogStore.addExercise({ ...props.exercise, ...next })
}

/** Пусто или 0 — гриф не учитывается */
async function updateBar(event: Event) {
  const raw = (event.target as HTMLInputElement).value.trim()
  const bar = raw === '' ? null : Number(raw.replace(',', '.'))
  if (bar !== null && (!Number.isFinite(bar) || bar < 0)) return
  await catalogStore.addExercise({ ...props.exercise, barWeight: bar })
}
</script>

<template>
  <div class="dlg-overlay" @click.self="emit('close')">
    <div class="dlg">
      <div class="dlg-head">
        <input
          class="dlg-name"
          :value="exercise.name"
          @blur="rename"
          @keydown.enter="($event.target as HTMLInputElement).blur()"
        />
        <button class="dlg-close" @click="emit('close')"><X class="size-4" /></button>
      </div>

      <div class="dlg-section">
        <span class="dlg-label">Мышцы</span>
        <div class="dlg-pills">
          <button
            v-for="mg in catalogStore.muscleGroups" :key="mg.id"
            class="pill"
            :class="{
              active: exercise.muscleGroups.includes(mg.id),
              weak: weakOf(exercise).includes(mg.id),
            }"
            @click="cycleGroup(mg.id)"
          ><MgIcon :id="mg.id" :size="14" bare /> {{ mg.label }}</button>
        </div>
        <span class="dlg-hint">нажатие: не работает → активная → слабо активная</span>
      </div>

      <div class="dlg-section dlg-bar">
        <span class="dlg-label">Гриф, кг</span>
        <input
          class="dlg-bar-input"
          type="number" step="0.25" min="0"
          :value="exercise.barWeight ?? ''"
          placeholder="0"
          @change="updateBar"
        />
        <span class="dlg-hint">прибавляется к блинам в статистике</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dlg-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgb(0 0 0 / 65%);
}

.dlg {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 520px;
  max-width: 92vw;
  max-height: 86vh;
  overflow-y: auto;
  padding: 16px;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  background: #131313;
}

.dlg-head {
  display: flex;
  align-items: center;
  gap: 8px;
}

.dlg-name {
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  background: #0a0a0a;
  color: #eee;
  font-size: 0.95rem;
}
.dlg-name:focus { outline: none; border-color: #5a8; }

.dlg-close {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 2px;
}
.dlg-close:hover { color: #ddd; }

.dlg-section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dlg-label {
  color: #888;
  font-size: 0.75rem;
}

.dlg-hint {
  color: #555;
  font-size: 0.68rem;
}

.dlg-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 9px 3px 6px;
  border: 1px solid #2a2a2a;
  border-radius: 12px;
  background: #1a1a1a;
  color: #888;
  cursor: pointer;
  font-size: 0.74rem;
  white-space: nowrap;
}
.pill:hover { border-color: #444; color: #bbb; }
.pill.active { border-color: #d4635c; background: #2a1a1a; color: #d4635c; }
.pill.weak { border-color: #d1a343; background: #2a2418; color: #d1a343; }

.dlg-bar {
  display: grid;
  grid-template-columns: auto 90px 1fr;
  align-items: center;
  gap: 10px;
}

.dlg-bar-input {
  padding: 5px 8px;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  background: #0a0a0a;
  color: #eee;
  font-size: 0.85rem;
}
.dlg-bar-input:focus { outline: none; border-color: #5a8; }
</style>
