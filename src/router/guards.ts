// 为受保护的应用路由添加鉴权守卫。
import { hasToken } from '@/api/user'
import router from '.'

const whiteList = ['/login', '/notFound']

router.beforeEach((to, from, next) => {
  const token = hasToken()

  if (token) {
    if (to.path === '/login') {
      next({ path: '/home' })
      return
    }

    next()
    return
  }

  if (whiteList.includes(to.path)) {
    next()
    return
  }

  next({ path: `/login?redirect=${encodeURIComponent(to.fullPath)}` })
})
