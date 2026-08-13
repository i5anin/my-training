<script setup lang="ts">
import type { Program } from '@/constants/programs'
import { ShieldCheck, ShieldAlert } from 'lucide-vue-next'

defineProps<{ program: Program; active: boolean }>()
</script>

<template>
  <button class="pcard" :class="{ active }">
    <div class="pcard-top">
      <span class="pcard-author">{{ program.author }}</span>
      <ShieldCheck v-if="program.spineSafe" class="size-4 shield-ok" />
      <ShieldAlert v-else class="size-4 shield-warn" />
    </div>
    <div class="pcard-title">{{ program.title }}</div>
    <div class="pcard-meta">
      <span class="chip">{{ program.daysPerWeek }} дн/нед</span>
      <span class="chip">{{ program.level }}</span>
    </div>
  </button>
</template>

<style scoped>
.pcard {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  text-align: left;
  background: #1a1a1a;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
  color: #ddd;
  cursor: pointer;
}
.pcard:hover { border-color: #444; }
.pcard.active { border-color: #5a8; background: #1a2a22; }

.pcard-top {
  display: flex;
  align-items: center;
  gap: 8px;
}
.pcard-author {
  flex: 1;
  font-weight: 600;
  color: #eee;
}
.shield-ok { color: #5a8; }
.shield-warn { color: #c88; }

.pcard-title {
  font-size: 0.85rem;
  color: #aaa;
}
.pcard-meta {
  display: flex;
  gap: 6px;
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
</style>
