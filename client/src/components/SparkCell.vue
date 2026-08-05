<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{ pts: number[]; sw: number; sh: number; unit?: string }>(),
  { unit: 'кг' },
)

const SP = { t: 3, r: 3, b: 3, l: 3 }

const spark = computed(() => {
  const pts = props.pts
  if (pts.length < 2) return null
  const mn = Math.min(...pts) * 0.9
  const mx = Math.max(...pts) * 1.05 || 1
  const W = props.sw, H = props.sh
  const sx = (i: number) => SP.l + i / (pts.length - 1) * (W - SP.l - SP.r)
  const sy = (v: number) => SP.t + (H - SP.t - SP.b) * (1 - (v - mn) / (mx - mn))
  const coords = pts.map((v, i) => ({ x: sx(i), y: sy(v) }))
  const path = coords.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const last = coords[coords.length - 1]
  if (!last) return null
  const bLine = H - SP.b
  const area = path + ` L${last.x.toFixed(1)},${bLine} L${SP.l},${bLine} Z`
  const trend = (pts[pts.length - 1] ?? 0) - (pts[0] ?? 0)
  const color = trend >= 0 ? '#5a8' : '#a55'
  // Заливка в тон линии: зелёная при росте, красная при спаде
  const fill = trend >= 0 ? 'rgba(90,170,136,0.08)' : 'rgba(170,85,85,0.08)'
  return { path, area, lastX: last.x, lastY: last.y, color, fill }
})
</script>

<template>
  <div class="spark-wrap">
    <svg v-if="spark" :viewBox="`0 0 ${sw} ${sh}`" class="spark">
      <path :d="spark.area" :fill="spark.fill" />
      <path :d="spark.path" fill="none" :stroke="spark.color"
        stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"
      />
      <circle :cx="spark.lastX" :cy="spark.lastY" r="2.5" :fill="spark.color" />
    </svg>
    <span v-else-if="pts.length === 1" class="single">{{ Math.round(pts[0] ?? 0) }} {{ unit }}</span>
  </div>
</template>

<style scoped>
.spark-wrap {
  flex-shrink: 0;
  width: 88px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}
.spark {
  width: 88px;
  height: 30px;
  display: block;
}
.single {
  font-size: 0.72rem;
  color: #555;
  font-weight: 600;
}
</style>
