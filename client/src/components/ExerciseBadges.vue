<script setup lang="ts">
import MgIcon from '@/components/MgIcon.vue'
import KindBadge from '@/components/KindBadge.vue'
import { useMuscleInvolvement } from '@/composables/muscleInvolvement'
import { kindOf, musclesOnly } from '@/constants/workloadKinds'
import type { Exercise } from '@/types'

/**
 * Метки упражнения в каталоге: вид нагрузки (если не силовое) и буквы
 * мышц — красные активные, жёлтые слабо активные.
 */
const props = defineProps<{ exercise: Exercise }>()

const { weakBadges } = useMuscleInvolvement()

const kind = () => kindOf(props.exercise)
const active = () => musclesOnly(props.exercise.muscleGroups)
const weak = () => musclesOnly(weakBadges(props.exercise))
</script>

<template>
  <KindBadge v-if="kind().id !== 'strength'" :kind="kind()" />
  <MgIcon
    v-for="id in active()" :key="id"
    :id="id" :size="18" involvement="primary" bare
  />
  <MgIcon
    v-for="id in weak()" :key="id"
    :id="id" :size="18" involvement="secondary" bare
  />
</template>
