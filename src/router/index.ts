// 声明登录、文档和知识库等页面路由。
import { createRouter, createWebHistory } from 'vue-router'

// 路由表集中维护页面入口，页面组件继续按需懒加载。
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'default',
      redirect: '/home',
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/pages/login/index.vue'),
    },
    {
      path: '/documents/:id',
      name: 'documentEditor',
      component: () => import('@/pages/editor/EditorIndex.vue'),
    },
    {
      path: '/knowledge',
      name: 'knowledgeHome',
      component: () => import('@/pages/knowledge/index.vue'),
    },
    {
      path: '/knowledge/:id',
      name: 'knowledgeEditor',
      component: () => import('@/pages/knowledge/KnowledgeEditor.vue'),
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
      redirect: '/notFound',
    },
  ],
})

export default router
