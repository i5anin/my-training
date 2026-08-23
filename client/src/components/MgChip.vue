<script setup lang="ts">
import { computed } from 'vue'
import MgIcon from '@/components/MgIcon.vue'
import { useCatalogStore } from '@/stores/catalogStore'
import {
  getMuscleGroupColor, INVOLVEMENT_COLORS, type Involvement,
} from '@/constants/muscleGroupIcons'

/**
 * Чип группы мышц: бейдж-буква плюс полное название. Нужен там, где
 * место позволяет читать подпись, а не наводиться на кружок.
 *
 * Цвет по умолчанию — по семье мышц. С `involvement` цвет означает
 * вклад в упражнение: красный — активная, жёлтый — слабо активная.
 */
const props = withDefaults(defineProps<{
  id: string
  size?: number
  involvement?: Involvement
  /** Приглушённый чип: тот же цвет, меньше веса в композиции */
  muted?: boolean
  /** Только подпись: буква уже стоит рядом отдельным бейджем */
  plain?: boolean
}>(), { size: 16, involvement: undefined, muted: false, plain: false })

const catalogStore = useCatalogStore()

const label = computed(
  () => catalogStore.muscleGroups.find((g) => g.id === props.id)?.label ?? props.id,
)
const color = computed(() => props.involvement
  ? INVOLVEMENT_COLORS[props.involvement]
  : getMuscleGroupColor(props.id))
</script>

<template>
  <span
    class="mg-chip"
    :class="{ muted, plain }"
    :style="plain ? undefined : { color, borderColor: color }"
  >
    <MgIcon v-if="!plain" :id="id" :size="size" :involvement="involvement" bare />
    <span class="mg-chip-label">{{ label }}</span>
  </span>
</template>

<style scoped>
.mg-chip {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 2px 9px 2px 3px;
  border: 1px solid;
  border-radius: 999px;
  font-size: 0.78rem;
  line-height: 1.2;
  white-space: nowrap;
}

.mg-chip-label {
  opacity: 0.9;
}

.mg-chip.muted {
  opacity: 0.5;
}

/* Пояснение к букве-бейджу: читается, но не перетягивает внимание */
.mg-chip.plain {
  padding: 2px 8px;
  border-color: #232323;
  color: #6b6b6b;
  font-size: 0.72rem;
}
</style>
