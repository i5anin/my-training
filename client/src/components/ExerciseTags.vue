<script setup lang="ts">
import { computed } from 'vue'
import MgIcon from '@/components/MgIcon.vue'
import MgChip from '@/components/MgChip.vue'
import TagBadge from '@/components/TagBadge.vue'
import { useCatalogStore } from '@/stores/catalogStore'
import { distinctByLetter, detailedOnly } from '@/constants/muscleGroupIcons'
import { kindOf, musclesOnly } from '@/constants/workloadKinds'
import { patternOf } from '@/constants/movementPatterns'

/**
 * Правая часть строки упражнения: буквы групп, метки вида нагрузки и
 * паттерна движения, подписи рабочих мышц. Буквы и метки занимают
 * колонки фиксированной ширины — иначе строки не выстраиваются в столбик.
 */
const props = defineProps<{ exerciseId: string }>()

const catalogStore = useCatalogStore()
const exercise = computed(() => catalogStore.getExerciseById(props.exerciseId))

const active = computed(() => musclesOnly(exercise.value?.muscleGroups ?? []))
const letters = computed(() => distinctByLetter(active.value))

/** Силовое не подписываем — это режим по умолчанию */
const kind = computed(() => {
  const value = kindOf(exercise.value)
  return value.id === 'strength' ? null : value
})

/** Паттерн скрывается, если дублирует метку вида — как «кардио» */
const pattern = computed(() => {
  const value = patternOf(exercise.value)
  return value && value.id !== kind.value?.id ? value : null
})

const working = computed(() => {
  const shown = detailedOnly(active.value)
  const weak = detailedOnly(musclesOnly(exercise.value?.secondaryMuscleGroups ?? []))
  return { shown, weak: weak.filter((id) => !shown.includes(id)) }
})
</script>

<template>
  <span class="ex-tags">
    <span class="letters">
      <MgIcon v-for="id in letters" :key="id" :id="id" :size="22" />
    </span>
    <span class="tags">
      <TagBadge v-if="kind" :label="kind.label" :color="kind.color" />
      <TagBadge v-if="pattern" :label="pattern.label" :color="pattern.color" />
    </span>
    <span class="chips">
      <MgChip v-for="id in working.shown" :key="id" :id="id" plain />
      <MgChip v-for="id in working.weak" :key="id" :id="id" plain muted />
    </span>
  </span>
</template>

<style scoped>
/* Сетка вместо flex: буквы, метки и мышцы стоят в своих колонках,
   поэтому одинаковые данные выстраиваются по вертикали во всех строках */
.ex-tags {
  display: grid;
  grid-template-columns: 30px 92px minmax(0, 1fr);
  align-items: center;
  gap: 6px;
}

.letters {
  display: inline-flex;
  justify-content: flex-end;
  gap: 3px;
}

.tags {
  display: inline-flex;
  gap: 4px;
}

/* Подписи мышц: переносятся внутри своей колонки, не сдвигая соседей */
.chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}
</style>
