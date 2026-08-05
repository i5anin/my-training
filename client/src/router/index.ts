import { createRouter, createWebHashHistory } from 'vue-router'
import { defineComponent, h } from 'vue'

// Пустышка — рендерится в `<RouterView>`, но App.vue его всё равно
// не показывает на этих маршрутах (только меняет URL).
const Stub = defineComponent({ render: () => h('div') })

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    // Workouts tab
    { path: '/', name: 'list', component: Stub, meta: { tab: 'workouts' } },
    { path: '/workout/new', name: 'new-workout', meta: { tab: 'workouts' },
      component: () => import('@/views/WorkoutEditorView.vue') },
    { path: '/workout/:id', name: 'edit-workout', meta: { tab: 'workouts' },
      component: () => import('@/views/WorkoutEditorView.vue') },

    // Stats tab
    { path: '/stats', name: 'stats', component: Stub, meta: { tab: 'stats' } },
    { path: '/exercise/:id/chart', name: 'exercise-chart', meta: { tab: 'stats' },
      component: () => import('@/views/ExerciseChartView.vue') },

    // Catalog tab
    { path: '/catalog', name: 'catalog', component: Stub, meta: { tab: 'catalog' } },

    // Calendar tab
    { path: '/calendar', name: 'calendar', component: Stub, meta: { tab: 'calendar' } },

    // Неизвестный URL — на список тренировок
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

export default router
