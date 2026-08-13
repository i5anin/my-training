<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import type { Program, ProgramDay } from '@/constants/programs'
import { PROGRAMS } from '@/constants/programs'
import { useProgramImport } from '@/composables/useProgramImport'
import ProgramCard from '@/components/ProgramCard.vue'
import ProgramDayRow from '@/components/ProgramDayRow.vue'
import { ShieldCheck, ShieldAlert, CalendarPlus } from 'lucide-vue-next'

const router = useRouter()
const { busy, status, importDay, importWeek } = useProgramImport()

const selectedId = ref(PROGRAMS[0].id)
const selected = computed(() => PROGRAMS.find((p) => p.id === selectedId.value) ?? PROGRAMS[0])

const openDayId = ref<string | null>(PROGRAMS[0].days[0]?.id ?? null)

function toggleDay(id: string) {
  openDayId.value = openDayId.value === id ? null : id
}

function selectProgram(p: Program) {
  selectedId.value = p.id
  openDayId.value = p.days[0]?.id ?? null
}

// Добавленный день сразу открывается в редакторе — там вписываются веса
async function addDay(day: ProgramDay) {
  const id = await importDay(selected.value, day)
  if (id) router.push({ name: 'edit-workout', params: { id } })
}
</script>

<template>
  <div class="programs-view">
    <header class="pv-head">
      <h2>Программы тренировок</h2>
      <p class="pv-sub">
        Планы известных атлетов и личный гибрид. Любой день добавляется в журнал как
        черновик: упражнения и целевые повторы заполнены, веса — нет.
      </p>
    </header>

    <!-- ── Выбор программы ── -->
    <div class="pv-cards">
      <ProgramCard
        v-for="p in PROGRAMS"
        :key="p.id"
        :program="p"
        :active="p.id === selectedId"
        @click="selectProgram(p)"
      />
    </div>

    <!-- ── Детали выбранной программы ── -->
    <section class="pv-detail">
      <div class="pd-head">
        <div>
          <div class="pd-title">{{ selected.title }}</div>
          <div class="pd-sub">{{ selected.subtitle }}</div>
        </div>
        <button class="btn-week" :disabled="busy" @click="importWeek(selected)">
          <CalendarPlus class="size-4" />
          Добавить всю неделю
        </button>
      </div>

      <div class="pd-facts">
        <div><span class="k">Сплит</span><span class="v">{{ selected.split }}</span></div>
        <div><span class="k">Цель</span><span class="v">{{ selected.goal }}</span></div>
        <div v-if="selected.source">
          <span class="k">Источник</span><span class="v">{{ selected.source }}</span>
        </div>
      </div>

      <div class="pd-warn" :class="selected.spineSafe ? 'ok' : 'warn'">
        <ShieldCheck v-if="selected.spineSafe" class="size-4" />
        <ShieldAlert v-else class="size-4" />
        <span v-if="selected.spineNote">{{ selected.spineNote }}</span>
        <span v-else-if="selected.spineSafe">
          Осевая нагрузка на позвоночник исключена — присед, становая, жим стоя и бег заменены.
        </span>
        <span v-else>
          Содержит осевую нагрузку (присед, становая, жим стоя). При проблемах с позвоночником
          брать гибрид или заменять эти движения.
        </span>
      </div>

      <ul class="pd-notes">
        <li v-for="(n, i) in selected.notes" :key="i">{{ n }}</li>
      </ul>

      <p v-if="status" class="pd-status">{{ status }}</p>

      <div class="pd-days">
        <ProgramDayRow
          v-for="day in selected.days"
          :key="day.id"
          :day="day"
          :open="openDayId === day.id"
          :busy="busy"
          @toggle="toggleDay(day.id)"
          @add="addDay(day)"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.programs-view {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 14px;
  overflow-y: auto;
}

.pv-head h2 {
  margin: 0 0 4px;
  font-size: 1.1rem;
}
.pv-sub {
  margin: 0;
  color: #888;
  font-size: 0.85rem;
  max-width: 720px;
}

.pv-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 10px;
}

/* ── Детали ── */
.pv-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px;
  background: #161616;
  border: 1px solid #2a2a2a;
  border-radius: 8px;
}
.pd-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}
.pd-title { font-weight: 600; }
.pd-sub { color: #888; font-size: 0.85rem; }

.pd-facts {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 0.82rem;
}
.pd-facts .k {
  display: inline-block;
  width: 90px;
  color: #666;
}
.pd-facts .v { color: #bbb; }

.pd-warn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 0.82rem;
}
.pd-warn.ok { background: #14251d; color: #7cb; border: 1px solid #2a4a3a; }
.pd-warn.warn { background: #2a1d1d; color: #d99; border: 1px solid #4a2a2a; }

.pd-notes {
  margin: 0;
  padding-left: 18px;
  color: #999;
  font-size: 0.82rem;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.pd-status {
  margin: 0;
  color: #5a8;
  font-size: 0.82rem;
}

.pd-days {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.btn-week {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid #2a7a4a;
  border-radius: 6px;
  background: #2a7a4a;
  color: #fff;
  cursor: pointer;
  font-size: 0.82rem;
  white-space: nowrap;
}
.btn-week:hover { background: #3a8a5a; }
.btn-week:disabled { opacity: 0.5; cursor: default; }

@media (max-width: 600px) {
  .pd-head { flex-direction: column; }
}
</style>
