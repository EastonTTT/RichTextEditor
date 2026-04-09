// 为受保护的应用路由添加鉴权守卫。
import { hasToken } from '@/api/user'
import router from '.'

// 白名单页面不要求登录态。
const whiteList = ['/login', '/notFound']

// 路由守卫只处理最基础的鉴权分流，避免把业务判断塞进这里。
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
