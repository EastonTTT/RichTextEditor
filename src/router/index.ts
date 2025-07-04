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
    },
    {
      path: '/test',
      name: 'test',
      component: () => import('@/pages/editor/EditorIndex.vue'),
    },
    {
      path: '/Home',
      name: 'Home',
      component: () => import('@/pages/Home.vue'),
    },
  ],
})

export default router
