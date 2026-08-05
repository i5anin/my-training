<script setup lang="ts">
import { ref } from 'vue'
import { useCatalogStore } from '@/stores/catalogStore'
import ExercisesSection from '@/components/ExercisesSection.vue'
import MuscleGroupsSection from '@/components/MuscleGroupsSection.vue'

const catalogStore = useCatalogStore()
const tab = ref<'exercises' | 'groups'>('exercises')
</script>

<template>
  <div class="catalog-view">
    <!-- ── Вкладки ── -->
    <div class="cat-tabs">
      <button class="ctab" :class="{ active: tab === 'exercises' }" @click="tab = 'exercises'">
        Упражнения <span class="cnt">{{ catalogStore.exercises.length }}</span>
      </button>
      <button class="ctab" :class="{ active: tab === 'groups' }" @click="tab = 'groups'">
        Группы <span class="cnt">{{ catalogStore.muscleGroups.length }}</span>
      </button>
    </div>

    <!-- ─── Секции ─── -->
    <ExercisesSection v-if="tab === 'exercises'" />
    <MuscleGroupsSection v-else />
  </div>
</template>

<style scoped>
.catalog-view {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
  padding: 10px;
  gap: 10px;
}

/* ── Вкладки ── */
.cat-tabs {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.ctab {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  background: #1a1a1a;
  color: #888;
  cursor: pointer;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}
.ctab:hover { border-color: #5a8; color: #ccc; }
.ctab.active { border-color: #5a8; background: #1a2a22; color: #5a8; font-weight: 600; }
.cnt {
  font-size: 0.7rem;
  color: #555;
  background: #0a0a0a;
  border-radius: 9px;
  padding: 0 6px;
  min-width: 20px;
  text-align: center;
}
.ctab.active .cnt { color: #5a8; }
</style>
