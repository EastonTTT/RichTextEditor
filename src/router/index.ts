import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: () => import('@/pages/Login.vue'),
    },
    {
      path: '/mainbox',
      name: 'mainbox',
      component: () => import('@/pages/MainBox.vue'),
    }
  ],
})

export default router
