<script setup lang="ts">
import { onMounted, onUnmounted, ref, watch } from 'vue'
import { nanoid } from 'nanoid'
import { savePhoto, getPhotoUrl, deletePhoto } from '@/db'
import { Camera, X } from 'lucide-vue-next'

const props = withDefaults(defineProps<{ photoIds: string[]; thumbSize?: number }>(), {
  thumbSize: 32,
})
const emit = defineEmits<{ update: [ids: string[]] }>()

const previews = ref<Map<string, string>>(new Map())
const lightboxId = ref<string | null>(null)

function openLightbox(id: string) {
  lightboxId.value = id
}
function closeLightbox() {
  lightboxId.value = null
}
function onLightboxKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') closeLightbox()
}
onMounted(() => window.addEventListener('keydown', onLightboxKeydown))
onUnmounted(() => window.removeEventListener('keydown', onLightboxKeydown))

function loadPreviews() {
  for (const id of props.photoIds) {
    if (!previews.value.has(id)) {
      previews.value.set(id, getPhotoUrl(id))
    }
  }
}
loadPreviews()
watch(() => props.photoIds, loadPreviews)

async function onFileSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  const newIds: string[] = [...props.photoIds]

  for (const file of files) {
    const id = nanoid()
    const resized = await resizeImage(file)
    await savePhoto({ id, blob: resized })
    newIds.push(id)
    previews.value.set(id, getPhotoUrl(id))
  }

  emit('update', newIds)
}

async function removePhoto(id: string) {
  await deletePhoto(id)
  previews.value.delete(id)
  emit('update', props.photoIds.filter((pid) => pid !== id))
}

function resizeImage(file: File): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      drawToBlob(img, 1920).then(resolve)
    }
    img.src = URL.createObjectURL(file)
  })
}

function drawToBlob(img: HTMLImageElement, maxSize: number): Promise<Blob> {
  const canvas = document.createElement('canvas')
  let w = img.width, h = img.height
  if (w > maxSize || h > maxSize) {
    if (w > h) { h = (h / w) * maxSize; w = maxSize }
    else { w = (w / h) * maxSize; h = maxSize }
  }
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(img, 0, 0, w, h)
  return new Promise((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg', 0.85))
}
</script>

<template>
  <div class="photo-attach">
    <div class="photo-previews" v-if="photoIds.length">
      <div
        v-for="id in photoIds"
        :key="id"
        class="photo-thumb"
        :style="{ width: thumbSize + 'px', height: thumbSize + 'px' }"
      >
        <img :src="previews.get(id)" @click="openLightbox(id)" title="Открыть в полный размер" />
        <button class="photo-remove" @click="removePhoto(id)"><X class="size-3" /></button>
      </div>
    </div>
    <label class="photo-btn">
      <Camera class="size-4" />
      <input type="file" accept="image/*" multiple @change="onFileSelect" hidden />
    </label>
  </div>

  <Teleport to="body">
    <div v-if="lightboxId" class="photo-lightbox" @click="closeLightbox">
      <button class="lightbox-close" @click="closeLightbox"><X class="size-5" /></button>
      <img :src="previews.get(lightboxId)" @click.stop />
    </div>
  </Teleport>
</template>

<style scoped>
.photo-attach {
  display: flex;
  align-items: center;
  gap: 4px;
}

.photo-previews {
  display: flex;
  gap: 4px;
}

.photo-thumb {
  position: relative;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
}

.photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  cursor: zoom-in;
}

.photo-remove {
  position: absolute;
  top: -2px;
  right: -2px;
  background: rgba(0,0,0,0.7);
  color: #fff;
  border: none;
  font-size: 0.6rem;
  cursor: pointer;
  padding: 0 3px;
  border-radius: 50%;
}

.photo-btn {
  cursor: pointer;
  font-size: 1.1rem;
  padding: 2px 4px;
}

.photo-lightbox {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  cursor: zoom-out;
}

.photo-lightbox img {
  max-width: 92vw;
  max-height: 92vh;
  object-fit: contain;
  border-radius: 6px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
  cursor: default;
}

.lightbox-close {
  position: fixed;
  top: 16px;
  right: 20px;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  border-radius: 50%;
  padding: 8px;
  cursor: pointer;
}

.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.2);
}
</style>
