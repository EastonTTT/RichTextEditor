import '@/styles/index.less'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'undraw-ui/dist/style.css'       // 全局引入undraw-ui样式

import { createPinia } from 'pinia'
import { createApp } from 'vue'

import * as ElementPlusIconsVue from '@element-plus/icons-vue'


import App from './App.vue'
import router from './router'
import { useUserStore } from './stores/user'
import UndrawUi from 'undraw-ui'        // 引入undraw-ui

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)
app.use(UndrawUi)
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

// 初始化用户状态
const userStore = useUserStore()
userStore.initUserState()

app.mount('#app')
