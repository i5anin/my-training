<script setup lang="ts">
import { computed } from 'vue'
import { useCatalogStore } from '@/stores/catalogStore'
import { getMuscleGroupLetter, getMuscleGroupColor } from '@/constants/muscleGroupIcons'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

/**
 * Круглый бейдж группы мышц: буква + цвет по семье, полное название —
 * во всплывающей подсказке. Переиспользуемый UI-примитив: список
 * тренировок, календарь, выбор группы в редакторе, подписи у фото.
 */
const props = withDefaults(defineProps<{
  id: string
  size?: number
}>(), { size: 18 })

const catalog = useCatalogStore()

const letter = computed(() => getMuscleGroupLetter(props.id))
const color = computed(() => getMuscleGroupColor(props.id))
const label = computed(() => catalog.muscleGroups.find((g) => g.id === props.id)?.label ?? props.id)
// Двубуквенные («Кд») мельче — иначе не влезают в круг на маленьких размерах
const fontScale = computed(() => (letter.value.length > 1 ? 0.4 : 0.55))
</script>

<template>
  <Tooltip>
    <TooltipTrigger as-child>
      <span
        class="mg-icon"
        :style="{
          width: size + 'px',
          height: size + 'px',
          fontSize: size * fontScale + 'px',
          color,
          borderColor: color,
        }"
      >{{ letter }}</span>
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
