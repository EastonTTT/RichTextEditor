// 启动 Vue 应用并注册全局共享插件。
import '@/styles/index.less'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

import { createPinia } from 'pinia'
import { createApp } from 'vue'

import * as ElementPlusIconsVue from '@element-plus/icons-vue'


import App from './App.vue'
import router from './router'
import './router/guards.ts'

// 应用入口只负责装配全局依赖，业务初始化尽量下沉到各自模块。
const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(ElementPlus)
// 批量注册图标，避免在页面里逐个手动引入。
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}


app.mount('#app')
