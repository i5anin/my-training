<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useCatalogStore } from '@/stores/catalogStore'
import MgIcon from '@/components/MgIcon.vue'
import { Check, X } from 'lucide-vue-next'

const props = defineProps<{
  modelValue: string
  label: string
  disabledId?: string
}>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const catalogStore = useCatalogStore()

const open = ref(false)
const adding = ref(false)
const newName = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const dropdownRef = ref<HTMLElement | null>(null)

function onDoc(e: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(e.target as Node)) {
    open.value = false
  }
}
onMounted(() => document.addEventListener('mousedown', onDoc))
onUnmounted(() => document.removeEventListener('mousedown', onDoc))

const selected = () => catalogStore.muscleGroups.find(mg => mg.id === props.modelValue)

function select(id: string) {
  emit('update:modelValue', id)
  open.value = false
}

function startAdd() {
  open.value = false
  adding.value = true
  setTimeout(() => inputRef.value?.focus(), 50)
}

async function confirm() {
  const name = newName.value.trim()
  if (!name) return cancel()
  const id = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-zа-яё0-9-]/gi, '')
  // Имя из одних спецсимволов даёт пустой id — не создаём группу-призрак
  if (!id) return cancel()
  await catalogStore.addMuscleGroup({ id, label: name })
  emit('update:modelValue', id)
  newName.value = ''
  adding.value = false
}

function cancel() {
  newName.value = ''
  adding.value = false
}
</script>

<template>
  <div class="mg-select-wrap">
    <label class="mg-label">{{ label }}</label>

    <template v-if="!adding">
      <div class="dropdown" ref="dropdownRef">
        <button class="dropdown-btn" @click="open = !open" type="button">
          <template v-if="selected()">
            <MgIcon :id="selected()!.id" :size="24" />
            <span class="opt-label">{{ selected()!.label }}</span>
          </template>
          <span v-else class="placeholder">— не выбрано —</span>
          <span class="arrow">{{ open ? '▲' : '▼' }}</span>
        </button>

        <div v-if="open" class="dropdown-list">
          <div class="opt-item" @click="select('')">
            <span class="opt-label muted">— не выбрано —</span>
          </div>
          <div
            v-for="mg in catalogStore.muscleGroups"
            :key="mg.id"
            class="opt-item"
            :class="{ selected: mg.id === modelValue, disabled: mg.id === disabledId }"
            @click="mg.id !== disabledId && select(mg.id)"
          >
            <MgIcon :id="mg.id" :size="24" />
            <span class="opt-label">{{ mg.label }}</span>
          </div>
          <div class="opt-item opt-add" @click="startAdd">
            <span>＋ Добавить группу...</span>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div class="add-row">
        <input
          ref="inputRef"
          v-model="newName"
          class="add-input"
          placeholder="Название, напр. Икры"
          @keydown.enter.prevent="confirm"
          @keydown.escape.prevent="cancel"
        />
        <button class="btn-confirm" @click="confirm"><Check class="size-4" /></button>
        <button class="btn-cancel" @click="cancel"><X class="size-4" /></button>
      </div>
    </template>
  </div>
</template>

<style scoped>
.mg-select-wrap {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.mg-label {
  font-size: 0.78rem;
  color: #666;
}

.dropdown {
  position: relative;
}

.dropdown-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 7px 10px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #111;
  color: #eee;
  font-size: 0.9rem;
  font-family: inherit;
  cursor: pointer;
  text-align: left;
}

.dropdown-btn:focus {
  outline: none;
  border-color: #5a8;
}

.arrow {
  margin-left: auto;
  font-size: 0.6rem;
  color: #666;
}

.placeholder {
  color: #555;
}

.dropdown-list {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: #1a1a1a;
  border: 1px solid #333;
  border-radius: 6px;
  z-index: 100;
  max-height: 280px;
  overflow-y: auto;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
}

.opt-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  cursor: pointer;
  transition: background 0.1s;
}

.opt-item:hover {
  background: #2a2a2a;
}

.opt-item.selected {
  background: #1a3a2a;
}

.opt-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.opt-item.opt-add {
  color: #5a8;
  border-top: 1px solid #222;
  font-size: 0.85rem;
}

.opt-label {
  font-size: 0.9rem;
}

.muted {
  color: #555;
}

.add-row {
  display: flex;
  gap: 4px;
}

.add-input {
  flex: 1;
  min-width: 0;
  padding: 7px 10px;
  border: 1px solid #5a8;
  border-radius: 6px;
  background: #111;
  color: #eee;
  font-size: 0.9rem;
  font-family: inherit;
}

.add-input:focus { outline: none; }

.btn-confirm, .btn-cancel {
  padding: 6px 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  flex-shrink: 0;
}

.btn-confirm { background: #2a7a4a; color: #fff; }
.btn-confirm:hover { background: #3a8a5a; }
.btn-cancel { background: #3a2a2a; color: #aaa; }
.btn-cancel:hover { background: #5a3a3a; }
</style>
