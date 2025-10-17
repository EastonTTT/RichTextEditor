import router from ".";
const whiteList = [ '/login', '/homePage', '/notFound' ]

router.beforeEach((to, from ,next) => {
  const token = true
  if(token){
    if(to.path === '/login'){
      next({ path: '/'})
    } else{
      next()
    }
  } else{
    if(whiteList.includes(to.path)){
      next()
    } else{
      next({path: `/login?redirect=${to.fullPath}`}) // 便于登陆后返回原页面
    }
  }
})
