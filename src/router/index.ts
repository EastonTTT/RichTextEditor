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
      path: '/test',
      name: 'test',
      component: () => import('@/pages/editor/EditorIndex.vue'),
    },
    {
      path: '/storelist',
      name: 'storelist',
      component: () => import('@/pages/StoreList.vue'),
    },
    {
      path: '/doclist',
      name: 'doclist',
      component: () => import('@/pages/DocList.vue'),
    },
  ],
})

export default router
