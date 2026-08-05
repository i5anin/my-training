<script setup lang="ts">
import { ref } from 'vue'
import { useCatalogStore } from '@/stores/catalogStore'
import MgIcon from '@/components/MgIcon.vue'
import { X, Plus } from 'lucide-vue-next'
import { plural, slug } from '@/composables/textFormat'
import { useCatalogUsage } from '@/composables/useCatalogUsage'
import type { MuscleGroup } from '@/types'

const catalogStore = useCatalogStore()
const { groupUsage } = useCatalogUsage()

// ─── Добавление ─────────────────────────────────────────
const newGroupLabel = ref('')
const newGroupId = ref('')

async function addGroup() {
  const label = newGroupLabel.value.trim()
  if (!label) return
  const id = newGroupId.value.trim() || slug(label)
  if (!id) {
    alert('Название не содержит допустимых символов')
    return
  }
  if (catalogStore.muscleGroups.some((g) => g.id === id)) {
    alert('Группа с таким id уже существует')
    return
  }
  await catalogStore.addMuscleGroup({ id, label })
  newGroupLabel.value = ''
  newGroupId.value = ''
}

// ─── Переименование и удаление ──────────────────────────
async function updateGroupLabel(g: MuscleGroup, e: Event) {
  const input = e.target as HTMLInputElement
  const label = input.value
  if (!label.trim() || label === g.label) {
    input.value = g.label // переименование отклонено — вернуть прежнее значение
    return
  }
  await catalogStore.addMuscleGroup({ ...g, label: label.trim() })
}

async function deleteGroup(g: MuscleGroup) {
  const used = groupUsage.value.get(g.id) ?? 0
  const exUsed = catalogStore.exercises.filter((e) => e.muscleGroups.includes(g.id)).length
  const parts: string[] = []
  if (used > 0) parts.push(`${used} ${plural(used, 'тренировке', 'тренировках')}`)
  if (exUsed > 0) parts.push(`${exUsed} ${plural(exUsed, 'упражнении', 'упражнениях')}`)
  const msg = parts.length
    ? `Группа "${g.label}" используется в ${parts.join(' и ')}. Удалить?`
    : `Удалить "${g.label}"?`
  if (!confirm(msg)) return
  await catalogStore.removeMuscleGroup(g.id)
}
</script>

<template>
  <div class="mg-tab">
    <!-- Добавить -->
    <div class="add-form">
      <input v-model="newGroupLabel" placeholder="Название (Грудь)" class="add-input" />
      <input v-model="newGroupId" placeholder="id (chest)" class="add-input add-id" />
      <button class="btn-add" @click="addGroup" :disabled="!newGroupLabel.trim()"><Plus class="size-4" /></button>
    </div>

    <!-- Список -->
    <div class="mg-list">
      <div v-for="g in catalogStore.muscleGroups" :key="g.id" class="mg-item" :title="'id: ' + g.id">
        <MgIcon :id="g.id" :size="22" />
        <input
          class="mg-label-input"
          :value="g.label"
          @blur="updateGroupLabel(g, $event)"
          @keydown.enter="($event.target as HTMLInputElement).blur()"
        />
        <span class="mg-usage" :title="`Использований: ${groupUsage.get(g.id) ?? 0}`">
          {{ groupUsage.get(g.id) ?? 0 }}×
        </span>
        <button class="del-btn" title="Удалить" @click="deleteGroup(g)"><X class="size-3.5" /></button>
      </div>
    </div>
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
.add-id { max-width: 90px; }
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

/* ── Список групп ── */
.mg-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mg-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: #161616;
  border: 1px solid #1f1f1f;
}
.mg-item:hover { background: #1a1a1a; }

.mg-label-input {
  flex: 1;
  min-width: 0;
  padding: 3px 6px;
  border: 1px solid transparent;
  border-radius: 4px;
  background: transparent;
  color: #eee;
  font-size: 0.88rem;
}
.mg-label-input:hover { border-color: #2a2a2a; background: #0a0a0a; }
.mg-label-input:focus { outline: none; border-color: #5a8; background: #0a0a0a; }

.mg-usage {
  font-size: 0.65rem;
  color: #444;
  flex-shrink: 0;
  min-width: 24px;
  text-align: right;
}

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
</style>
