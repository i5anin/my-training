<script setup lang="ts">
import { computed, ref } from 'vue'
import { X } from 'lucide-vue-next'
import { useCatalogStore } from '@/stores/catalogStore'
import { getMuscleGroupPhoto } from '@/constants/muscleGroupPhotos'
import { getMuscleGroupImage } from '@/constants/muscleGroupIcons'
import { musclesOnly } from '@/constants/workloadKinds'

/**
 * Миниатюра упражнения: анатомическая схема ведущей группы мышц.
 * Наведение показывает увеличенную превью, нажатие — полный размер.
 *
 * Превью и полный размер уходят в body через Teleport: таблица режет
 * overflow, и внутри неё увеличенная картинка обрезалась по ячейке.
 */
const props = defineProps<{ exerciseId: string; size?: number }>()

const catalogStore = useCatalogStore()
const open = ref(false)
const hoverPos = ref<{ top: number; left: number } | null>(null)

const exercise = computed(() => catalogStore.getExerciseById(props.exerciseId))

const image = computed(() => {
  const ids = musclesOnly(exercise.value?.muscleGroups ?? [])
  for (const id of ids) {
    const photo = getMuscleGroupPhoto(id)
    if (photo) return photo
  }
  // Фото на группу нет — берём анатомическую схему
  for (const id of ids) {
    const scheme = getMuscleGroupImage(id)
    if (scheme) return scheme
  }
  return null
})

const label = computed(() => exercise.value?.name ?? props.exerciseId)

// Схемы мышц вертикальные, поэтому миниатюра портретная
const box = computed(() => ({
  width: `${props.size ?? 46}px`,
  height: `${Math.round((props.size ?? 46) * 1.35)}px`,
}))

const PREVIEW_HEIGHT = 420

function showPreview(event: MouseEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  // Превью держится рядом с миниатюрой и не вылезает за окно
  const top = Math.min(
    Math.max(8, rect.top + rect.height / 2 - PREVIEW_HEIGHT / 2),
    window.innerHeight - PREVIEW_HEIGHT - 8,
  )
  hoverPos.value = { top: Math.max(8, top), left: rect.right + 10 }
}

function hidePreview() {
  hoverPos.value = null
}
</script>

<template>
  <img
    v-if="image"
    :src="image"
    :alt="label"
    class="thumb"
    :style="box"
    @mouseenter="showPreview"
    @mouseleave="hidePreview"
    @click="open = true"
  />

  <Teleport to="body">
    <div
      v-if="hoverPos && image && !open"
      class="thumb-preview"
      :style="{ top: hoverPos.top + 'px', left: hoverPos.left + 'px' }"
    >
      <img :src="image" :alt="label" />
      <span class="thumb-preview-label">{{ label }}</span>
    </div>

    <div v-if="open && image" class="thumb-overlay" @click="open = false">
      <button class="thumb-close" @click="open = false"><X class="size-5" /></button>
      <img :src="image" :alt="label" class="thumb-full" @click.stop />
      <span class="thumb-caption">{{ label }}</span>
    </div>
  </Teleport>
</template>

<style scoped>
.thumb {
  flex-shrink: 0;
  border: 1px solid #2a2a2a;
  border-radius: 4px;
  object-fit: contain;
  background: #0d0d0d;
  cursor: zoom-in;
  transition: border-color 0.15s ease;
}
.thumb:hover { border-color: #5a8; }

.thumb-preview {
  position: fixed;
  z-index: 60;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px;
  border: 1px solid #2a3a32;
  border-radius: 8px;
  background: #0d0d0d;
  box-shadow: 0 10px 30px rgb(0 0 0 / 70%);
  pointer-events: none;
}

.thumb-preview img {
  display: block;
  height: 400px;
  width: auto;
}

.thumb-preview-label {
  color: #888;
  font-size: 0.72rem;
}

.thumb-overlay {
  position: fixed;
  inset: 0;
  z-index: 70;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  background: rgb(0 0 0 / 85%);
  cursor: zoom-out;
}

.thumb-full {
  max-width: 88vw;
  max-height: 82vh;
  border-radius: 8px;
}

.thumb-caption {
  color: #bbb;
  font-size: 0.85rem;
}

.thumb-close {
  position: absolute;
  top: 14px;
  right: 18px;
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
}
.thumb-close:hover { color: #ddd; }
</style>
