<template>
  <el-container class="home-container">
    <!-- 使用可复用的侧边栏组件 -->
    <Sidebar
      :user-name="userName"
      :active-menu="activeMenu"
      :recent-docs="recentDocs"
      :knowledge-base-options="knowledgeBaseOptions"
      @menu-select="handleMenuSelect"
      @create-document="handleCreateDocument"
    />

    <!-- 主内容区 -->
    <el-container class="main-container">
      <el-header class="main-header" />
      <el-main class="main-content">
        <div class="content-box">
          <h2>侧边栏组件使用示例</h2>
          <p>这是一个展示如何使用可复用侧边栏组件的示例页面。</p>
          <p>侧边栏组件包含以下功能：</p>
          <ul>
            <li>用户信息展示</li>
            <li>导航菜单（目录树、最近文档）</li>
            <li>新建文档功能</li>
          </ul>
        </div>
      </el-main>
      <el-footer class="main-footer">Element Plus ©2024 Created by 代码全都队</el-footer>
    </el-container>
  </el-container>
</template>

<script lang="ts" setup>
import { ElNotification } from 'element-plus'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'

// 创建router实例
const router = useRouter()

// 侧边栏相关数据
const userName = ref('示例用户')
const activeMenu = ref('1-1')
const recentDocs = ref([
  '示例文档A', '示例文档B', '示例文档C'
])

// 知识库选项
const knowledgeBaseOptions = ref([
  { value: 'kb1', label: '示例知识库1' },
  { value: 'kb2', label: '示例知识库2' },
  { value: 'kb3', label: '示例知识库3' }
])

/**
 * 菜单选择事件
 * @param index 菜单项index
 */
function handleMenuSelect(index: string) {
  ElNotification.info(`选择了菜单项: ${index}`)

  if (index === '1-1') {
    router.push('/storelist')
  } else if (index === '1-2') {
    router.push('/doclist')
  } else if (index.startsWith('2-')) {
    const idx = Number(index.split('-')[1])
    ElNotification.primary('跳转到' + recentDocs.value[idx] + '界面（待实现）')
  }
}

/**
 * 处理创建文档事件
 * @param documentData 文档数据
 */
function handleCreateDocument(documentData: { name: string; knowledgeBase: string }) {
  ElNotification.success(`创建文档: ${documentData.name}，所属知识库: ${documentData.knowledgeBase}`)
  // 这里可以添加实际的文档创建逻辑
}
</script>

<style scoped>
/* 整体容器样式 */
.home-container {
  position: fixed;
  inset: 0;
  display: flex;
  overflow: hidden;
}

/* 主容器样式 */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 头部样式 */
.main-header {
  height: 48px;
  background: #fff;
}

/* 主内容区样式 */
.main-content {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 内容盒子样式 */
.content-box {
  flex: 1;
  padding: 24px;
  margin-bottom: 16px;
  background: #fff;
  overflow-y: auto;
  word-wrap: break-word;
}

/* 页脚样式 */
.main-footer {
  padding: 20px 0;
  text-align: center;
  background: #f5f5f5;
}
</style>
