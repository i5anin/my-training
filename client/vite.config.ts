import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'
import tailwindcss from '@tailwindcss/vite'
import eslint from 'vite-plugin-eslint2'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueDevTools(),
    tailwindcss(),
    // Жёсткий линт: ошибка = красный оверлей в браузере + падение сборки.
    // lintOnStart выключен намеренно: иначе сервер падает до открытия
    // страницы и оверлей показать некому — линт идёт при загрузке модулей.
    eslint({
      lintOnStart: false,
      emitError: true,
      emitWarning: true,
      build: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
  server: {
    host: true,
    port: 4173,
    proxy: {
      '/api': 'http://localhost:3778',
    },
  },
  preview: {
    host: true,
    port: 4173,
    proxy: {
      '/api': 'http://localhost:3778',
    },
  },
})
