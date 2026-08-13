<script setup lang="ts">
import { computed } from 'vue'
import type { ProgramDay } from '@/constants/programs'
import { useCatalogStore } from '@/stores/catalogStore'
import { Plus, ChevronDown } from 'lucide-vue-next'

const props = defineProps<{ day: ProgramDay; open: boolean; busy: boolean }>()
const emit = defineEmits<{ toggle: []; add: [] }>()

const catalogStore = useCatalogStore()

const totalSets = computed(() =>
  props.day.exercises.reduce((sum, e) => sum + e.sets, 0),
)

const groups = computed(() =>
  [props.day.primaryType, props.day.secondaryType]
    .filter(Boolean)
    .map((id) => catalogStore.muscleGroups.find((g) => g.id === id)?.label ?? id)
    .join(' · '),
)
</script>

<template>
  <div class="day">
    <div class="day-head" @click="emit('toggle')">
      <ChevronDown class="size-4 chev" :class="{ open }" />
      <span class="day-title">{{ day.title }}</span>
      <span class="day-meta">{{ groups }}</span>
      <span class="chip">{{ day.exercises.length }} упр · {{ totalSets }} подх</span>
      <button class="btn btn-add" :disabled="busy" @click.stop="emit('add')">
        <Plus class="size-4" />
        Себе
      </button>
    </div>

    <table v-if="open" class="day-table">
      <thead>
        <tr>
          <th>Упражнение</th>
          <th class="num">Подх</th>
          <th class="num">Повт</th>
          <th>Заметка</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="ex in day.exercises" :key="ex.exerciseId">
          <td>{{ ex.name }}</td>
          <td class="num">{{ ex.sets }}</td>
          <td class="num">{{ ex.reps }}</td>
          <td class="note">{{ ex.note ?? '' }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.day {
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  overflow: hidden;
}
.day-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  background: #1a1a1a;
  cursor: pointer;
}
.day-head:hover { background: #202020; }
.chev { color: #666; transition: transform 0.15s; }
.chev.open { transform: rotate(180deg); }
.day-title { font-size: 0.88rem; }
.day-meta {
  flex: 1;
  color: #666;
  font-size: 0.78rem;
}
.chip {
  font-size: 0.7rem;
  color: #888;
  background: #0e0e0e;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  padding: 1px 8px;
  white-space: nowrap;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 10px;
  border: 1px solid #2a4a6a;
  border-radius: 6px;
  background: #2a4a6a;
  color: #eee;
  cursor: pointer;
  font-size: 0.8rem;
}
.btn:hover { background: #3a5a7a; }
.btn:disabled { opacity: 0.5; cursor: default; }

.day-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
}
.day-table th {
  text-align: left;
  padding: 6px 10px;
  color: #666;
  font-weight: 500;
  border-top: 1px solid #2a2a2a;
  border-bottom: 1px solid #2a2a2a;
}
.day-table td {
  padding: 5px 10px;
  color: #ccc;
  border-bottom: 1px solid #1e1e1e;
}
.day-table .num { width: 60px; text-align: right; }
.day-table .note { color: #777; }

@media (max-width: 600px) {
  .day-head { flex-wrap: wrap; }
  .day-meta { flex: 1 1 100%; }
}
</style>
