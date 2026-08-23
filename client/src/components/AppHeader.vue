<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Users, Dumbbell, LogIn, LogOut } from 'lucide-vue-next'
import { useUserStore } from '@/stores/userStore'
import { useWorkoutStore } from '@/stores/workoutStore'
import AuthPanel from '@/components/AuthPanel.vue'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'

/**
 * Верхняя шапка: название приложения, счётчики базы (тренировки по
 * всем профилям, профили) и вход. Пароля нет — вход это выбор профиля;
 * провайдеры (ВК, Яндекс, Google) пока заглушки, см. AuthPanel.
 */
const userStore = useUserStore()
const workoutStore = useWorkoutStore()
const authOpen = ref(false)

onMounted(() => userStore.load())

const initial = computed(
  () => (userStore.current?.name ?? '?').trim().charAt(0).toUpperCase(),
)
</script>

<template>
  <header class="app-header">
    <span class="ah-title">Моя тренировка</span>

    <div class="ah-right">
      <Tooltip>
        <TooltipTrigger as-child>
          <span class="ah-count">
            <Dumbbell class="size-3.5" />{{ workoutStore.workouts.length }}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          Тренировок в проекте, по всем профилям: {{ workoutStore.workouts.length }}
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger as-child>
          <span class="ah-count">
            <Users class="size-3.5" />{{ userStore.count }}
          </span>
        </TooltipTrigger>
        <TooltipContent>Профилей в проекте: {{ userStore.count }}</TooltipContent>
      </Tooltip>

      <template v-if="userStore.current">
        <span class="ah-user">
          <span class="ah-avatar">{{ initial }}</span>
          <span class="ah-name">{{ userStore.current.name }}</span>
        </span>
        <Tooltip>
          <TooltipTrigger as-child>
            <button class="ah-btn" @click="userStore.signOut()">
              <LogOut class="size-3.5" />Выход
            </button>
          </TooltipTrigger>
          <TooltipContent>Выйти из профиля</TooltipContent>
        </Tooltip>
      </template>

      <button v-else class="ah-btn ah-btn-in" @click="authOpen = true">
        <LogIn class="size-3.5" />Вход
      </button>
    </div>

    <AuthPanel v-if="authOpen" @close="authOpen = false" />
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  height: 40px;
  padding: 0 12px;
  background: var(--card);
  border-bottom: 1px solid var(--border);
}

.ah-title {
  color: #ddd;
  font-size: 0.9rem;
  font-weight: 600;
}

.ah-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

.ah-count {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #777;
  font-size: 0.78rem;
}

.ah-user {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #bbb;
  font-size: 0.8rem;
}

.ah-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: 1px solid #2a7a4a;
  border-radius: 50%;
  background: #1a3a2a;
  color: #5a8;
  font-size: 0.72rem;
  font-weight: 700;
}

.ah-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  background: #1a1a1a;
  color: #999;
  cursor: pointer;
  font-size: 0.76rem;
}
.ah-btn:hover { background: #222; color: #ccc; }

.ah-btn-in {
  border-color: #2a7a4a;
  background: #1a3a2a;
  color: #5a8;
}
.ah-btn-in:hover { background: #2a5a3a; color: #7cc; }
</style>
