<script setup lang="ts">
import { ref } from 'vue'
import { X } from 'lucide-vue-next'
import { useUserStore } from '@/stores/userStore'
import { AUTH_PROVIDERS, type AuthProvider } from '@/constants/authProviders'

/**
 * Панель входа. Провайдеры — заглушки: OAuth не подключён, кнопка
 * только сообщает об этом. Рабочий путь — вход локальным профилем.
 */
const emit = defineEmits<{ close: [] }>()

const userStore = useUserStore()
const stubNote = ref<string | null>(null)

function tryProvider(provider: AuthProvider) {
  stubNote.value = `Вход через ${provider.label} ещё не подключён`
}

function signIn(id: string) {
  userStore.signIn(id)
  emit('close')
}
</script>

<template>
  <div class="auth-overlay" @click.self="emit('close')">
    <div class="auth-panel">
      <div class="auth-head">
        <span class="auth-title">Вход</span>
        <button class="auth-close" @click="emit('close')"><X class="size-4" /></button>
      </div>

      <button
        v-for="p in AUTH_PROVIDERS" :key="p.id"
        class="auth-provider"
        :style="{ borderColor: p.color, color: p.color }"
        @click="tryProvider(p)"
      >{{ p.label }} <span class="auth-soon">скоро</span></button>

      <p v-if="stubNote" class="auth-note">{{ stubNote }}</p>

      <div class="auth-sep">или профиль на этом сервере</div>

      <button
        v-for="u in userStore.users" :key="u.id"
        class="auth-local"
        @click="signIn(u.id)"
      >{{ u.name }}<span v-if="u.isOwner" class="auth-owner">владелец</span></button>
    </div>
  </div>
</template>

<style scoped>
.auth-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
}

.auth-panel {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 280px;
  padding: 14px;
  border: 1px solid #2a2a2a;
  border-radius: 10px;
  background: #131313;
}

.auth-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.auth-title {
  color: #ddd;
  font-size: 0.95rem;
  font-weight: 600;
}

.auth-close {
  background: none;
  border: none;
  color: #555;
  cursor: pointer;
  padding: 2px;
}
.auth-close:hover { color: #aaa; }

.auth-provider,
.auth-local {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  border: 1px solid #2a2a2a;
  border-radius: 6px;
  background: #1a1a1a;
  color: #ccc;
  cursor: pointer;
  font-size: 0.82rem;
}
.auth-provider:hover,
.auth-local:hover { background: #222; }

.auth-soon,
.auth-owner {
  color: #555;
  font-size: 0.68rem;
}

.auth-note {
  margin: 0;
  color: #a97;
  font-size: 0.72rem;
}

.auth-sep {
  margin-top: 6px;
  color: #555;
  font-size: 0.7rem;
}
</style>
