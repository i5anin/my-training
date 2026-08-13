<script setup lang="ts">
import { ref, watch } from 'vue'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  Dumbbell, LineChart, Library, CalendarDays, ClipboardList,
  ChevronsLeft, ChevronsRight,
} from 'lucide-vue-next'

type Tab = 'workouts' | 'stats' | 'catalog' | 'calendar' | 'programs'

const NAV_TABS = [
  { tab: 'workouts', label: 'Тренировки', icon: Dumbbell },
  { tab: 'stats', label: 'Прогресс', icon: LineChart },
  { tab: 'catalog', label: 'Каталог', icon: Library },
  { tab: 'calendar', label: 'Календарь', icon: CalendarDays },
  { tab: 'programs', label: 'Программы', icon: ClipboardList },
] as const

defineProps<{ activeTab: Tab }>()
const emit = defineEmits<{ select: [tab: Tab] }>()

// ── Свёрнуто (только иконки) / развёрнуто (иконки + подписи) ──
const navExpanded = ref(localStorage.getItem('gym.navExpanded') === '1')
watch(navExpanded, (v) => localStorage.setItem('gym.navExpanded', v ? '1' : '0'))
</script>

<template>
  <aside class="navrail" :class="{ expanded: navExpanded }">
    <div class="logo">
      <Dumbbell class="size-6 text-primary" />
      <span class="nav-label">Gym+</span>
    </div>
    <nav class="navrail-items">
      <Tooltip v-for="item in NAV_TABS" :key="item.tab">
        <TooltipTrigger as-child>
          <button
            class="nav-item"
            :class="{ active: activeTab === item.tab }"
            @click="emit('select', item.tab)"
          >
            <component :is="item.icon" class="size-5" />
            <span class="nav-label">{{ item.label }}</span>
          </button>
        </TooltipTrigger>
        <TooltipContent v-if="!navExpanded" side="right">{{ item.label }}</TooltipContent>
      </Tooltip>
    </nav>
    <Tooltip>
      <TooltipTrigger as-child>
        <button class="nav-item nav-toggle" @click="navExpanded = !navExpanded">
          <ChevronsLeft v-if="navExpanded" class="size-4" />
          <ChevronsRight v-else class="size-4" />
          <span class="nav-label">Свернуть</span>
        </button>
      </TooltipTrigger>
      <TooltipContent v-if="!navExpanded" side="right">Развернуть</TooltipContent>
    </Tooltip>
  </aside>
</template>

<style scoped>
/* ─── Левое меню: свёрнуто — только иконки, развёрнуто — с подписями ─── */
.navrail {
  flex-shrink: 0;
  width: 52px;
  background: var(--card);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  padding: 10px 6px;
  gap: 12px;
  transition: width 0.15s ease;
  overflow: hidden;
}

.navrail.expanded {
  width: 172px;
}

.logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  height: 40px;
  flex-shrink: 0;
  font-weight: 600;
}

.navrail-items {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  height: 40px;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 8px;
  color: #888;
  cursor: pointer;
  font-size: 0.8rem;
  line-height: 1;
  white-space: nowrap;
  transition: background 0.15s, color 0.15s;
}

.nav-item:hover {
  background: #222;
  color: #ccc;
}

.nav-item.active {
  background: #1a2a22;
  color: #5a8;
}

.nav-label {
  display: none;
}

.navrail.expanded .nav-label {
  display: inline;
}

.navrail.expanded .logo {
  justify-content: flex-start;
  padding-left: 10px;
}

.navrail.expanded .nav-item {
  justify-content: flex-start;
  gap: 10px;
  padding: 0 10px;
}

.nav-toggle {
  margin-top: auto;
  color: #555;
}

/* ─── Mobile ─── */
@media (max-width: 600px) {
  /* Рельса превращается в верхнюю полосу (иконки, без разворота) */
  .navrail,
  .navrail.expanded {
    width: 100%;
    flex-direction: row;
    align-items: center;
    padding: 4px 8px;
    gap: 8px;
    border-right: none;
    border-bottom: 1px solid var(--border);
  }

  .navrail-items {
    flex-direction: row;
    flex: 1;
    justify-content: space-around;
  }

  .nav-item,
  .navrail.expanded .nav-item {
    padding: 6px 10px;
    justify-content: center;
    gap: 0;
  }

  .navrail .nav-label {
    display: none;
  }

  .nav-toggle {
    display: none;
  }
}
</style>
