<script setup lang="ts">
import { onMounted, ref, watch, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useCatalogStore } from '@/stores/catalogStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import WorkoutListView from '@/views/WorkoutListView.vue'
import StatsView from '@/views/StatsView.vue'
import CatalogView from '@/views/CatalogView.vue'
import CalendarView from '@/views/CalendarView.vue'
import ProgressSummary from '@/components/ProgressSummary.vue'
import NavRail from '@/components/NavRail.vue'
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip'
import { Dumbbell, LineChart } from 'lucide-vue-next'

const catalogStore = useCatalogStore()
const workoutStore = useWorkoutStore()
const route = useRoute()
const router = useRouter()

type Tab = 'workouts' | 'stats' | 'catalog' | 'calendar'
const activePanel = computed<Tab>(() => (route.meta.tab as Tab) ?? 'workouts')

// Вкладки без правой панели — занимают весь экран
const FULL_WIDTH_TABS = new Set<Tab>(['catalog', 'calendar'])
const isFullWidth = computed(() => FULL_WIDTH_TABS.has(activePanel.value))

// Маршруты, которые показывают что-то в правой панели
const RIGHT_PANEL_ROUTES = new Set(['new-workout', 'edit-workout', 'exercise-chart'])
const hasRightContent = computed(() => RIGHT_PANEL_ROUTES.has(route.name as string))

// Корневой маршрут каждой вкладки
const TAB_ROUTES: Record<Tab, string> = {
  workouts: 'list', stats: 'stats', catalog: 'catalog', calendar: 'calendar',
}

// Сравнение по route.name: клик по активной вкладке с подмаршрута
// (редактор, график) возвращает на корневой маршрут вкладки
function goTab(tab: Tab) {
  const target = TAB_ROUTES[tab]
  if (route.name === target) return
  router.push({ name: target })
}

// ── Resizable панель ──
const MIN_W = 240, MAX_W = 900
const storedWidth = Number(localStorage.getItem('gym.panelWidth')) || 320
const panelWidth = ref(Math.max(MIN_W, Math.min(MAX_W, storedWidth)))
watch(panelWidth, (w) => localStorage.setItem('gym.panelWidth', String(w)))

let dragging = false
function startDrag(e: MouseEvent) {
  dragging = true
  e.preventDefault()
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', stopDrag, { once: true })
}
function onDrag(e: MouseEvent) {
  if (!dragging) return
  panelWidth.value = Math.max(MIN_W, Math.min(MAX_W, e.clientX))
}
function stopDrag() {
  dragging = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  window.removeEventListener('mousemove', onDrag)
}

onMounted(async () => {
  await catalogStore.load()
  await workoutStore.load()
})
</script>

<template>
  <TooltipProvider :delay-duration="300">
  <div class="app-shell">
    <!-- ─── Левое меню: лого + вкладки ─── -->
    <NavRail :active-tab="activePanel" @select="goTab" />

    <div class="app-layout">
      <!-- Левая панель: список -->
      <aside
        class="panel-list"
        :class="{ 'panel-full': isFullWidth }"
        :style="!isFullWidth ? { width: panelWidth + 'px' } : {}"
      >
        <div class="panel-list-body">
          <WorkoutListView v-if="activePanel === 'workouts'" />
          <StatsView v-else-if="activePanel === 'stats'" />
          <CalendarView v-else-if="activePanel === 'calendar'" />
          <CatalogView v-else />
        </div>
      </aside>

      <!-- Resize handle (везде кроме каталога/календаря) -->
      <Tooltip v-if="!isFullWidth">
        <TooltipTrigger as-child>
          <div class="resize-handle" @mousedown="startDrag"></div>
        </TooltipTrigger>
        <TooltipContent side="right">Тяни чтобы изменить ширину</TooltipContent>
      </Tooltip>

      <!-- Правая панель: редактор / графики (везде кроме каталога/календаря) -->
      <main v-if="!isFullWidth" class="panel-editor">
        <RouterView v-if="hasRightContent" />
        <div v-else-if="activePanel === 'stats'" class="stats-landing">
          <ProgressSummary />
          <div class="editor-empty">
            <div class="editor-empty-inner">
              <div class="editor-empty-icon"><LineChart class="size-10" /></div>
              <div>Выберите упражнение чтобы увидеть график</div>
            </div>
          </div>
        </div>
        <div v-else class="editor-empty">
          <div class="editor-empty-inner">
            <div class="editor-empty-icon"><Dumbbell class="size-10" /></div>
            <div>Выберите тренировку или создайте новую</div>
          </div>
        </div>
      </main>
    </div>
  </div>
  </TooltipProvider>
</template>

<style>
*, *::before, *::after {
  box-sizing: border-box;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: #121212;
  color: #eee;
  font-family: system-ui, -apple-system, sans-serif;
}

/* ─── Скроллбары ─── */
* {
  scrollbar-width: thin;
  scrollbar-color: #3a3a3a transparent;
}

*::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

*::-webkit-scrollbar-track {
  background: transparent;
}

*::-webkit-scrollbar-thumb {
  background-color: #3a3a3a;
  border-radius: 20px;
  border: 2px solid #121212;
  background-clip: padding-box;
}

*::-webkit-scrollbar-thumb:hover {
  background-color: #5a8;
}

*::-webkit-scrollbar-corner {
  background: transparent;
}

#app {
  height: 100%;
}
</style>

<style scoped>
.app-shell {
  display: flex;
  height: 100vh;
}

.app-layout {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* ─── Левая панель ─── */
.panel-list {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--card);
  border-right: 1px solid var(--border);
}

/* В режиме каталога панель растягивается на всё окно */
.panel-list.panel-full {
  flex: 1;
  width: 100%;
}
.panel-list.panel-full .panel-list-body {
  display: flex;
  justify-content: center;
}
.panel-list.panel-full .panel-list-body > * {
  width: 100%;
  max-width: 1100px;
}
.panel-list.panel-full .panel-list-body > .calendar-view {
  max-width: 1600px;
}

/* ─── Resize handle ─── */
.resize-handle {
  flex-shrink: 0;
  width: 4px;
  background: transparent;
  cursor: col-resize;
  transition: background 0.15s;
  position: relative;
}
.resize-handle:hover { background: var(--primary); }
.resize-handle:active { background: var(--primary); }
.resize-handle::before {
  content: '';
  position: absolute;
  top: 0;
  left: -3px;
  right: -3px;
  bottom: 0;
}

.panel-list-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ─── Правая панель ─── */
/* Flex-колонка: бар «Сохранить/Редактировать» в редакторе прижимается
   к нижней кромке (margin-top: auto), даже если контента мало */
.panel-editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  /* Без нижнего паддинга: sticky-бар должен вставать вплотную к кромке */
  padding: 20px 16px 0;
  min-width: 0;
}

.editor-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-landing {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-landing .editor-empty {
  flex: 1;
}

.editor-empty-inner {
  text-align: center;
  color: #444;
}

.editor-empty-icon {
  margin-bottom: 12px;
}

/* ─── Mobile ─── */
@media (max-width: 600px) {
  .app-shell {
    flex-direction: column;
  }

  .app-layout {
    flex-direction: column;
  }

  .panel-list {
    width: 100% !important;
    max-height: 45vh;
    border-right: none;
    border-bottom: 1px solid #2a2a2a;
  }

  .resize-handle { display: none; }

  .panel-editor {
    padding: 12px 14px 0;
  }
}
</style>
