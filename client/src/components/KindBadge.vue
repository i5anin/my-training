<script setup lang="ts">
import type { WorkloadKind } from '@/constants/workloadKinds'

/**
 * Метка вида нагрузки: силовое, кардио, растяжка. Вид — не мышца,
 * поэтому у него своя метка, отдельно от чипов мышц.
 */
defineProps<{ kind: WorkloadKind }>()
</script>

<template>
  <span class="kind-badge" :style="{ color: kind.color, borderColor: kind.color }">
    {{ kind.label }}
  </span>
</template>

<style scoped>
.kind-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border: 1px solid;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  white-space: nowrap;
}
</style>
