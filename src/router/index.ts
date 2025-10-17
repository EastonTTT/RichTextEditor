import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory('tempBaseUrl'),
  routes: [
    {
      path: '/',
      name: 'default',
      redirect: '/home',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/login/index.vue')
    },
    {
      path: '/test',
      name: 'test',
      component: () => import('@/pages/editor/EditorIndex.vue'),
    },
    {
      path: '/home',
      name: 'homePage',
      component: () => import('@/pages/homePage/index.vue'),
    },
    {
      path: '/notFound',
      name: 'notFound',
      component: () => import('@/pages/404.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/notFound'
    }
  ],
})

export default router
