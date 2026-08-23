import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { User } from '@/types'
import { getAllUsers, saveUser } from '@/db'

const ACTIVE_KEY = 'gym.userId'

/**
 * Профили проекта и текущий вход. Пароля нет: вход — это выбор
 * профиля, он же запоминается в localStorage. Провайдеры (ВК, Яндекс,
 * Google) пока заглушки, см. constants/authProviders.
 */
export const useUserStore = defineStore('user', () => {
  const users = ref<User[]>([])
  const activeId = ref<string | null>(localStorage.getItem(ACTIVE_KEY))

  const count = computed(() => users.value.length)
  const current = computed<User | null>(
    () => users.value.find((u) => u.id === activeId.value) ?? null,
  )
  /** Профиль по умолчанию для кнопки входа: владелец базы */
  const owner = computed<User | null>(
    () => users.value.find((u) => u.isOwner) ?? users.value[0] ?? null,
  )

  async function load() {
    users.value = await getAllUsers()
    // Профиль удалён на другой машине — не держать мёртвый вход
    if (activeId.value && !users.value.some((u) => u.id === activeId.value)) signOut()
  }

  function signIn(id: string) {
    activeId.value = id
    localStorage.setItem(ACTIVE_KEY, id)
  }

  function signOut() {
    activeId.value = null
    localStorage.removeItem(ACTIVE_KEY)
  }

  async function save(user: User) {
    await saveUser(user)
    await load()
  }

  return { users, count, current, owner, load, signIn, signOut, save }
})
