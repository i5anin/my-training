<script setup lang="ts">
import { ref } from 'vue'
import type { ExerciseEntry } from '@/types'
import ExerciseEntryCard from '@/components/ExerciseEntryCard.vue'
import { GripVertical } from 'lucide-vue-next'

withDefaults(defineProps<{ muscleGroups: string[]; readonly?: boolean }>(), {
  readonly: false,
})

const entries = defineModel<ExerciseEntry[]>('entries', { required: true })

function updateEntry(index: number, entry: ExerciseEntry) {
  entries.value[index] = entry
}

function removeEntry(index: number) {
  entries.value.splice(index, 1)
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
  const next = [...entries.value]
  const [moved] = next.splice(src, 1)
  next.splice(i, 0, moved!)
  entries.value = next
  dragSrc.value = null
  dragOver.value = null
}

function onDragEnd() {
  dragSrc.value = null
  dragOver.value = null
}

function getSupersetLabel(entry: ExerciseEntry): string | undefined {
  if (!entry.supersetGroupId) return undefined
  const groupEntries = entries.value.filter((e) => e.supersetGroupId === entry.supersetGroupId)
  // Осиротевший суперсет (второе упражнение удалено) — метка не нужна
  if (groupEntries.length < 2) return undefined
  const pos = groupEntries.indexOf(entry) + 1
  return `Суперсет ${pos}/${groupEntries.length}`
}
</script>

<template>
  <div class="entries">
    <div
      v-for="(entry, i) in entries"
      :key="entry.id"
      class="entry-drag-wrap"
      :class="{
        'drag-src': dragSrc === i,
        'drag-over': dragOver === i && dragSrc !== i,
      }"
      :draggable="!readonly"
      @dragstart="onDragStart(i, $event)"
      @dragover="onDragOver(i, $event)"
      @drop="onDrop(i)"
      @dragend="onDragEnd"
    >
      <div v-if="!readonly" class="drag-handle" title="Перетащить"><GripVertical class="size-4" /></div>
      <div class="entry-card-flex">
        <ExerciseEntryCard
          :entry="entry"
          :index="i"
          :muscleGroups="muscleGroups"
          :supersetLabel="getSupersetLabel(entry)"
          @update="updateEntry(i, $event)"
          @remove="removeEntry(i)"
        />
      </div>
    </div>
  </div>
</template>

<style scoped>
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
</style>
