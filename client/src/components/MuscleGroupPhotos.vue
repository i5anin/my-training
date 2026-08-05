<script setup lang="ts">
import { computed } from 'vue'
import { getMuscleGroupPhoto } from '@/constants/muscleGroupPhotos'
import { getMuscleGroupIcon, getMuscleGroupImage } from '@/constants/muscleGroupIcons'
import { useCatalogStore } from '@/stores/catalogStore'

const props = defineProps<{
  primaryType: string
  secondaryType: string
}>()

const catalog = useCatalogStore()

interface GroupInfo {
  id: string
  label: string
  photo: string
}

const groups = computed<GroupInfo[]>(() => {
  const result: GroupInfo[] = []
  // Set — от дублей ключей, если primaryType === secondaryType
  for (const id of new Set([props.primaryType, props.secondaryType])) {
    if (!id) continue
    const photo = getMuscleGroupPhoto(id)
    if (!photo) continue
    const label = catalog.muscleGroups.find(mg => mg.id === id)?.label ?? id
    result.push({ id, label, photo })
  }
  return result
})
</script>

<template>
  <div class="mg-photos" v-if="groups.length">
    <div class="mg-row">
      <div class="mg-item" v-for="g in groups" :key="g.id">
        <div class="mg-label">
          <img v-if="getMuscleGroupImage(g.id)" :src="getMuscleGroupImage(g.id)!" :alt="g.label" class="mg-icon-img" />
          <span v-else>{{ getMuscleGroupIcon(g.id) }}</span>
          {{ g.label }}
        </div>
        <img :src="g.photo" :alt="g.label" class="mg-photo" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.mg-photos {
  margin-top: 2px;
}

.mg-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mg-item {
  width: 100%;
}

.mg-label {
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.mg-icon-img {
  width: 18px;
  height: 18px;
  object-fit: cover;
  border-radius: 3px;
  flex-shrink: 0;
}

.mg-photo {
  width: 100%;
  height: auto;
  aspect-ratio: 3/4;
  object-fit: contain;
  border-radius: 8px;
  background: #0e0e0e;
  border: 1px solid #2a2a2a;
  display: block;
}
</style>
