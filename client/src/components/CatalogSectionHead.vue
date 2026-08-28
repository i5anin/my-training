<script setup lang="ts">
import { ChevronDown, ChevronRight } from 'lucide-vue-next'
import MgIcon from '@/components/MgIcon.vue'
import { getMuscleGroupColor } from '@/constants/muscleGroupIcons'

/**
 * Заголовок секции каталога. Уровень задаёт вид: семья мышц — крупная
 * плашка с цветной полосой, подгруппа — тоньше и с отступом.
 */
const props = defineProps<{
  groupId: string
  label: string
  count: number
  open: boolean
  level?: 1 | 2
}>()

defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    class="head"
    :class="level === 2 ? 'level-2' : 'level-1'"
    :style="{ '--fam': getMuscleGroupColor(props.groupId) }"
    @click="$emit('toggle')"
  >
    <component
      :is="open ? ChevronDown : ChevronRight"
      class="arrow"
      :class="level === 2 ? 'size-3' : 'size-4'"
    />
    <MgIcon v-if="groupId !== 'other'" :id="groupId" :size="level === 2 ? 15 : 18" />
    <span class="label">{{ label }}</span>
    <span class="count">{{ count }}</span>
  </button>
</template>

<style scoped>
.head {
  display: flex;
  align-items: center;
  width: 100%;
  border: none;
  cursor: pointer;
}

.arrow { color: var(--fam, #666); flex-shrink: 0; }

/* Счётчик плашкой — не сливается с названиями упражнений */
.count {
  margin-left: auto;
  padding: 1px 7px;
  border-radius: 10px;
  background: #00000055;
  color: #999;
  font-size: 0.72rem;
  letter-spacing: 0;
}

/* ── 1-й уровень: семья мышц ── */
.level-1 {
  gap: 8px;
  margin-top: 14px;
  padding: 8px 10px;
  border-left: 3px solid var(--fam, #444);
  border-radius: 0 6px 6px 0;
  background: linear-gradient(90deg, color-mix(in srgb, var(--fam, #444) 16%, #1a1a1a), #171717 65%);
  color: #f0f0f0;
  font-size: 0.88rem;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.level-1:hover {
  background: linear-gradient(90deg, color-mix(in srgb, var(--fam, #444) 26%, #1a1a1a), #1c1c1c 65%);
}

.level-1 .label { font-weight: 700; }

/* ── 2-й уровень: подгруппа внутри семьи ── */
.level-2 {
  gap: 7px;
  width: calc(100% - 16px);
  margin: 6px 0 2px 16px;
  padding: 4px 9px;
  border-left: 2px solid color-mix(in srgb, var(--fam, #555) 60%, transparent);
  border-radius: 0 5px 5px 0;
  background: #191919;
  color: #cfcfcf;
  font-size: 0.79rem;
}

.level-2:hover { background: #212121; color: #fff; }
.level-2 .label { font-weight: 600; }
</style>
