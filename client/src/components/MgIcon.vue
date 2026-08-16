<script setup lang="ts">
import { computed } from 'vue'
import { getMuscleGroupLetter, getMuscleGroupColor } from '@/constants/muscleGroupIcons'

const props = withDefaults(defineProps<{
  id: string
  size?: number
}>(), { size: 18 })

const letter = computed(() => getMuscleGroupLetter(props.id))
const color = computed(() => getMuscleGroupColor(props.id))
// Двубуквенные («Кд») мельче — иначе не влезают в круг на маленьких размерах
const fontScale = computed(() => (letter.value.length > 1 ? 0.4 : 0.55))
</script>

<template>
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
