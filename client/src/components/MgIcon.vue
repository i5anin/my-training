<script setup lang="ts">
import { computed } from 'vue'
import { useCatalogStore } from '@/stores/catalogStore'
import {
  getMuscleGroupLetter, getMuscleGroupColor,
  INVOLVEMENT_COLORS, INVOLVEMENT_LABELS, type Involvement,
} from '@/constants/muscleGroupIcons'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

/**
 * Круглый бейдж группы мышц: буква + цвет, полное название — во
 * всплывающей подсказке. Переиспользуемый UI-примитив: список
 * тренировок, календарь, выбор группы в редакторе, подписи у фото.
 *
 * Цвет по умолчанию — по семье мышц. С `involvement` цвет означает
 * вклад в упражнение: красный — активная, жёлтый — слабо активная.
 */
const props = withDefaults(defineProps<{
  id: string
  size?: number
  involvement?: Involvement
  /** Без своей подсказки: её даёт родитель или подпись рядом */
  bare?: boolean
}>(), { size: 18, involvement: undefined, bare: false })

const catalog = useCatalogStore()

const letter = computed(() => getMuscleGroupLetter(props.id))
const color = computed(() => props.involvement
  ? INVOLVEMENT_COLORS[props.involvement]
  : getMuscleGroupColor(props.id))
const name = computed(() => catalog.muscleGroups.find((g) => g.id === props.id)?.label ?? props.id)
const label = computed(() => props.involvement
  ? `${name.value} — ${INVOLVEMENT_LABELS[props.involvement]}`
  : name.value)
// Двубуквенные («Кд») мельче — иначе не влезают в круг на маленьких размерах
const fontScale = computed(() => (letter.value.length > 1 ? 0.4 : 0.55))

const badgeStyle = computed(() => ({
  width: `${props.size}px`,
  height: `${props.size}px`,
  fontSize: `${props.size * fontScale.value}px`,
  color: color.value,
  borderColor: color.value,
}))
</script>

<template>
  <span
    v-if="bare"
    class="mg-icon"
    :style="badgeStyle"
  >{{ letter }}</span>

  <Tooltip v-else>
    <TooltipTrigger as-child>
      <span class="mg-icon" :style="badgeStyle">{{ letter }}</span>
    </TooltipTrigger>
    <TooltipContent>{{ label }}</TooltipContent>
  </Tooltip>
</template>

<style scoped>
.mg-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1.5px solid;
  border-radius: 50%;
  font-weight: 700;
  line-height: 1;
  vertical-align: middle;
  flex-shrink: 0;
}
</style>
