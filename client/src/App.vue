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
import { Button } from '@/components/ui/button'
import { TooltipProvider } from '@/components/ui/tooltip'
import { Dumbbell, LineChart, Library, CalendarDays } from 'lucide-vue-next'

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

function goTab(tab: Tab) {
  if (activePanel.value === tab) return
  if (tab === 'workouts') router.push({ name: 'list' })
  else if (tab === 'stats') router.push({ name: 'stats' })
  else if (tab === 'calendar') router.push({ name: 'calendar' })
  else router.push({ name: 'catalog' })
}

// ── Resizable панель ──
const MIN_W = 240, MAX_W = 900
const panelWidth = ref(Number(localStorage.getItem('gym.panelWidth')) || 320)
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
    <!-- ─── Верхняя панель: лого + табы (всегда на одном месте) ─── -->
    <header class="topbar">
      <span class="logo">
        <Dumbbell class="size-5 text-primary" />
        <span>Gym+</span>
      </span>
      <nav class="flex items-center gap-1">
        <Button
          :variant="activePanel === 'workouts' ? 'secondary' : 'ghost'"
          size="sm"
          @click="goTab('workouts')"
        >
          <Dumbbell class="size-4" />
          <span class="hidden sm:inline">Тренировки</span>
        </Button>
        <Button
          :variant="activePanel === 'stats' ? 'secondary' : 'ghost'"
          size="sm"
          @click="goTab('stats')"
        >
          <LineChart class="size-4" />
          <span class="hidden sm:inline">Прогресс</span>
        </Button>
        <Button
          :variant="activePanel === 'catalog' ? 'secondary' : 'ghost'"
          size="sm"
          @click="goTab('catalog')"
        >
          <Library class="size-4" />
          <span class="hidden sm:inline">Каталог</span>
        </Button>
        <Button
          :variant="activePanel === 'calendar' ? 'secondary' : 'ghost'"
          size="sm"
          @click="goTab('calendar')"
        >
          <CalendarDays class="size-4" />
          <span class="hidden sm:inline">Календарь</span>
        </Button>
      </nav>
    </header>

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
      <div
        v-if="!isFullWidth"
        class="resize-handle"
        @mousedown="startDrag"
        title="Тяни чтобы изменить ширину"
      ></div>

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
  flex-direction: column;
  height: 100vh;
}

/* ─── Topbar ─── */
.topbar {
  flex-shrink: 0;
  height: 52px;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 14px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.05rem;
  font-weight: 600;
  flex-shrink: 0;
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

.ptab {
  width: 32px;
  height: 28px;
  border: 1px solid #333;
  border-radius: 6px;
  background: #1a1a1a;
  color: #555;
  cursor: pointer;
  font-size: 0.95rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s;
}
.ptab:hover { border-color: #5a8; color: #ccc; }
.ptab.active { border-color: #5a8; background: #1a2a22; color: #5a8; }

.panel-list-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ─── Правая панель ─── */
.panel-editor {
  flex: 1;
  overflow-y: auto;
  padding: 20px 16px;
  min-width: 0;
}

.editor-empty {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-landing {
  height: 100%;
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
  font-size: 2.5rem;
  margin-bottom: 12px;
}

/* ─── Mobile ─── */
@media (max-width: 600px) {
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
    padding: 12px 14px;
  }
}
</style>
