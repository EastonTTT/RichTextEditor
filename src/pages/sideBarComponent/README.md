# Sidebar 侧边栏组件

这是一个可复用的侧边栏组件，包含用户信息、导航菜单和新建文档功能。

## 功能特性

- 用户信息展示（头像和用户名）
- 导航菜单（目录树、最近文档）
- 新建文档功能（包含完整的UI界面）
- 完全可配置的属性
- 事件驱动的交互

## 使用方法

### 基本用法

```vue
<template>
  <el-container class="home-container">
    <Sidebar 
      :user-name="userName"
      :active-menu="activeMenu"
      :recent-docs="recentDocs"
      :knowledge-base-options="knowledgeBaseOptions"
      @menu-select="handleMenuSelect"
      @create-document="handleCreateDocument"
    />
    <!-- 其他内容 -->
  </el-container>
</template>

<script setup>
import Sidebar from '@/components/Sidebar.vue'
import { ref } from 'vue'

const userName = ref('用户名')
const activeMenu = ref('1-1')
const recentDocs = ref(['文档A', '文档B', '文档C'])
const knowledgeBaseOptions = ref([
  { value: 'kb1', label: '知识库1' },
  { value: 'kb2', label: '知识库2' }
])

function handleMenuSelect(index) {
  console.log('选择了菜单项:', index)
}

function handleCreateDocument(documentData) {
  console.log('创建文档:', documentData)
}
</script>
```

## 属性 (Props)

| 属性名 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| userName | string | '代码全都队' | 用户名 |
| activeMenu | string | '1-1' | 当前激活的菜单项 |
| recentDocs | string[] | ['文档A', '文档B', ...] | 最近文档列表 |
| knowledgeBaseOptions | Array<{value: string, label: string}> | 默认知识库选项 | 知识库选项列表 |

## 事件 (Events)

| 事件名 | 参数 | 说明 |
|--------|------|------|
| menu-select | index: string | 菜单选择事件 |
| create-document | documentData: {name: string, knowledgeBase: string} | 创建文档事件 |

## 样式定制

组件使用 scoped 样式，主要样式类包括：

- `.sidebar`: 侧边栏容器
- `.user-info-box`: 用户信息区域
- `.user-name`: 用户名样式

## 注意事项

1. 组件依赖 Element Plus 组件库
2. 需要确保 `@/assets/logo.png` 文件存在
3. 新建文档功能只提供UI界面，实际创建逻辑需要在父组件中实现
4. 菜单路由跳转逻辑可以根据需要自定义

## 示例

参考 `SidebarExample.vue` 文件查看完整的使用示例。 