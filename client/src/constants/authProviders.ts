/**
 * Внешние провайдеры входа. Пока заглушки: кнопки в панели входа есть,
 * OAuth-обмен не реализован — подключать по одному, когда появятся
 * ключи приложений.
 */
export interface AuthProvider {
  id: 'vk' | 'yandex' | 'google'
  label: string
  color: string
}

export const AUTH_PROVIDERS: AuthProvider[] = [
  { id: 'vk', label: 'ВКонтакте', color: '#4a76a8' },
  { id: 'yandex', label: 'Яндекс', color: '#fc3f1d' },
  { id: 'google', label: 'Google', color: '#4285f4' },
]
