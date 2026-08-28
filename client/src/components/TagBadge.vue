<script setup lang="ts">
/**
 * Стикер-метка у упражнения: вид нагрузки или паттерн движения.
 * Форма одна для всех, различие только в цвете — иначе метки в строке
 * читаются как разные сущности.
 */
defineProps<{ label: string; color: string }>()
</script>

<template>
  <span class="tag-badge" :style="{ color, borderColor: color }">{{ label }}</span>
</template>

<style scoped>
.tag-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border: 1px solid;
  border-radius: 4px;
  font-size: 0.7rem;
  line-height: 1.2;
  white-space: nowrap;
}
</style>
