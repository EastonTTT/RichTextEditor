<template>
  <!--
    Home1页面（Element Plus 版）
    用Element Plus组件实现侧边栏、用户信息、菜单、内容区、面包屑和页脚。
    结构与Home.vue一致，风格统一，便于维护。
  -->
  <el-container class="home-container">
    <!-- 侧边栏 -->
    <el-aside width="220px" class="sidebar">
      <!-- 用户信息区 -->
      <div class="user-info-box">
        <!-- 使用本地logo.png作为头像 -->
        <el-avatar :src="logoUrl" size="large" style="background: #fff; color: #222129;" />
        <span class="user-name">代码全都队</span>
      </div>
      <!-- 导航菜单 -->
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical-demo"
        background-color="#132b3e"
        text-color="#fff"
        active-text-color="#ffd04b"
        @select="handleMenuSelect"
        :unique-opened="true"
        style="border-right: none;"
      >
        <!-- 目录树分组 -->
        <el-sub-menu index="1">
          <template #title>
            <span>目录树</span>
          </template>
          <el-menu-item index="1-1">知识库列表</el-menu-item>
          <el-menu-item index="1-2">文档列表</el-menu-item>
        </el-sub-menu>
        <!-- 最近文档分组 -->
        <el-sub-menu index="2">
          <template #title>
            <span>最近文档</span>
          </template>
          <el-menu-item v-for="(doc, idx) in recentDocs" :key="doc" :index="`2-${idx}`">{{ doc }}</el-menu-item>
        </el-sub-menu>
        <!-- 新建文档按钮 -->
        <el-menu-item index="3" @click="openCreateDocument">
          <span>新建文档</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <!-- 主内容区 -->
    <el-container class="main-container">
      <el-header class="main-header" />
      <!-- 面包屑导航 -->
      <div class="breadcrumb-container">
        <div class="breadcrumb-wrapper">
          <el-breadcrumb separator="/" class="breadcrumb" style="margin-right: 60px;">
            <el-breadcrumb-item>我的知识库</el-breadcrumb-item>
          </el-breadcrumb>
          <el-input v-model="nameInput" style="width: 240px" placeholder="输入名称" />
          <el-input v-model="onwerInput" style="width: 240px" placeholder="输入所有者"/>
          <el-date-picker
            v-model="startDate"
            type="date"
            placeholder="起始日期"
            style="width: 180px"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
          <el-date-picker
            v-model="endDate"
            type="date"
            placeholder="结束日期"
            style="width: 180px"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
          <el-button type="info" round @click="searchStore">查询</el-button>
          <el-button type="info" round @click="openCreateDialog">新建知识库</el-button>
        </div>
      </div>
      <el-main class="main-content">
        <!-- 内容展示区 -->
        <div class="content-box">
          <el-table :data="tableData" style="width: 100%">
            <el-table-column prop="name" label="名称" width="300" />
            <el-table-column prop="owner" label="所有者" width="300" />
            <el-table-column prop="date" label="最近查看" />
            <el-table-column prop="action" label="操作" width="80">
              <template #default="scope">
                <el-icon class="action-icon" @click="openStoreOperationDialog(scope.$index)">
                  <MoreFilled />
                </el-icon>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-main>
      <el-footer class="main-footer">Element Plus ©2024 Created by 代码全都队</el-footer>
    </el-container>
  </el-container>

  <!-- 新建知识库对话框 -->
  <el-dialog
    v-model="createDialogVisible"
    title="新建知识库"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form :model="createForm" label-width="100px">
      <el-form-item label="知识库名称" required>
        <el-input
          v-model="createForm.name"
          placeholder="请输入知识库名称"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeCreateKnowledgeBaseDialog">取消</el-button>
        <el-button type="primary" @click="createKnowledgeBase">创建</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 新建文档对话框 -->
  <el-dialog
    v-model="createDocumentDialogVisible"
    title="新建文档"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-form :model="createDocumentForm" label-width="100px">
      <el-form-item label="文档名称" required>
        <el-input
          v-model="createDocumentForm.name"
          placeholder="请输入文档名称"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="所属知识库" required>
        <el-select v-model="createDocumentForm.knowledgeBase" placeholder="请选择知识库" style="width: 100%">
          <el-option
            v-for="item in knowledgeBaseOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeCreateDocumentDialog">取消</el-button>
        <el-button type="primary" @click="createDocument">创建</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 知识库操作对话框 -->
  <el-dialog
    v-model="storeOperationDialogVisible"
    title="知识库操作"
    width="500px"
    :close-on-click-modal="false"
  >
    <el-tabs v-model="activeTab" type="card">
      <!-- 重命名标签页 -->
      <el-tab-pane label="重命名" name="rename">
        <el-form :model="renameForm" label-width="100px" style="margin-top: 20px;">
          <el-form-item label="新名称" required>
            <el-input
              v-model="renameForm.newName"
              placeholder="请输入新的知识库名称"
              maxlength="50"
              show-word-limit
            />
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 删除标签页 -->
      <el-tab-pane label="删除" name="delete">
        <div style="margin-top: 20px; text-align: center;">
          <el-icon style="font-size: 48px; color: #f56c6c; margin-bottom: 16px;">
            <Warning />
          </el-icon>
          <h3 style="color: #f56c6c; margin-bottom: 16px;">确认删除</h3>
          <p style="color: #666; margin-bottom: 20px;">
            您确定要删除这个知识库吗？此操作不可恢复。
          </p>
          <el-input
            v-model="deleteForm.confirmText"
            placeholder="请输入 'DELETE' 确认删除"
            style="width: 300px;"
          />
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeStoreOperationDialog">取消</el-button>
        <el-button
          v-if="activeTab === 'delete'"
          type="danger"
          @click="handleStoreOperation"
          :disabled="deleteForm.confirmText !== 'DELETE'"
        >
          删除
        </el-button>
        <el-button
          v-else
          type="primary"
          @click="handleStoreOperation"
        >
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script lang="ts" setup>
/**
 * Home页面（Element Plus 版）
 *
 * 用于展示主布局，包括侧边栏（用户信息、目录树、最近文档、新建文档）和主内容区。
 *
 * @component
 */
import logo from '@/assets/logo.png'
import { ElNotification } from 'element-plus'
import { MoreFilled, Warning } from '@element-plus/icons-vue'
import { ref } from 'vue'
import { useRouter } from 'vue-router'

// 创建router实例
const router = useRouter()

// 头像图片地址
const logoUrl = logo

// 当前激活菜单项
const activeMenu = ref('1-1')
// 最近文档列表
const recentDocs = ref([
  '文档A', '文档B', '文档C', '文档D', '文档E', '文档F', '文档G', '文档H'
])

// 输入名称
const nameInput = ref('')
// 输入所有者
const onwerInput = ref('')

// 起始日期
const startDate = ref('')

// 结束日期
const endDate = ref('')

// 对话框相关
const createDialogVisible = ref(false)
const createForm = ref({
  name: '',
})

// 新建文档对话框相关
const createDocumentDialogVisible = ref(false)
const createDocumentForm = ref({
  name: '',
  knowledgeBase: '',
})

// 知识库选项
const knowledgeBaseOptions = ref([
  {
    value: 'knowledgeBase1',
    label: '知识库A',
  },
  {
    value: 'knowledgeBase2',
    label: '知识库B',
  },
  {
    value: 'knowledgeBase3',
    label: '知识库C',
  },
])

//文档列表
const tableData = ref([
  {
    name: '知识库A',
    owner: '张三',
    date: '2025-06-15',
    action: '操作',
  },
  {
    name: '知识库B',
    owner: '李四',
    date: '2025-06-15',
    action: '操作',
  },
  {
    name: '知识库C',
    owner: '王五',
    date: '2025-06-15',
    action: '操作',
  }
])

/**
 * 菜单选择事件
 * @input 菜单项index
 * @process 根据index判断点击了哪个菜单，执行对应操作
 * @output 弹窗或跳转（此处为弹窗演示）
 */
function handleMenuSelect(index: string) {
  if (index === '1-1') {
    // ElNotification.primary('跳转到知识库列表界面（待实现）')
    router.push('/storelist');
  } else if (index === '1-2') {
    // ElNotification.primary('跳转到文档列表界面（待实现）')
    router.push('/doclist');
  } else if (index.startsWith('2-')) {
    const idx = Number(index.split('-')[1])
    ElNotification.primary('跳转到' + recentDocs.value[idx] + '界面（待实现）')
  } else if (index === '3') {
    openCreateDocument()
  }
}

/**
 * 打开新建文档对话框
 */
function openCreateDocument() {
  createDocumentDialogVisible.value = true
  // 重置表单
  createDocumentForm.value = {
    name: '',
    knowledgeBase: '',
  }
}

/**
 * 关闭新建文档对话框
 */
function closeCreateDocumentDialog() {
  createDocumentDialogVisible.value = false
}

/**
 * 创建文档
 */
function createDocument() {
  if (!createDocumentForm.value.name.trim()) {
    ElNotification.warning('请输入文档名称')
    return
  }

  if (!createDocumentForm.value.knowledgeBase) {
    ElNotification.warning('请选择所属知识库')
    return
  }

  // 这里可以添加创建文档的逻辑
  ElNotification.success('文档创建成功！')
  closeCreateDocumentDialog()
}

/**
 * 打开新建知识库对话框
 */
function openCreateDialog() {
  createDialogVisible.value = true
  // 重置表单
  createForm.value = {
    name: '',
  }
}

/**
 * 关闭新建知识库对话框
 */
function closeCreateKnowledgeBaseDialog() {
  createDialogVisible.value = false
}

/**
 * 创建知识库
 */
function createKnowledgeBase() {
  if (!createForm.value.name.trim()) {
    ElNotification.warning('请输入知识库名称')
    return
  }

  // 创建新知识库对象
  const newKnowledgeBase = {
    name: createForm.value.name,
    owner: '默认',
    date: new Date().toISOString().split('T')[0], // 当前日期，格式：YYYY-MM-DD
    action: '操作'
  }

  // 将新知识库添加到列表开头
  tableData.value.unshift(newKnowledgeBase)

  // 显示成功提示
  ElNotification.success('知识库创建成功！')

  // 关闭对话框
  closeCreateKnowledgeBaseDialog()
}

// 知识库操作对话框相关
const storeOperationDialogVisible = ref(false)
const activeTab = ref('rename')
const currentRowIndex = ref(-1) // 当前选中的行索引
const renameForm = ref({
  newName: ''
})
const deleteForm = ref({
  confirmText: ''
})

function openStoreOperationDialog(rowIndex: number) {
  storeOperationDialogVisible.value = true
  currentRowIndex.value = rowIndex
  renameForm.value.newName = ''
  deleteForm.value.confirmText = ''
}

/**
 * 关闭知识库操作对话框
 */
function closeStoreOperationDialog() {
  storeOperationDialogVisible.value = false
}

/**
 * 处理知识库操作
 */
function handleStoreOperation() {
  if (activeTab.value === 'rename') {
    // 处理重命名逻辑
    if (!renameForm.value.newName.trim()) {
      ElNotification.warning('请输入新的知识库名称')
      return
    }

    // 重命名指定行的知识库
    if (currentRowIndex.value >= 0 && currentRowIndex.value < tableData.value.length) {
      tableData.value[currentRowIndex.value].name = renameForm.value.newName
    }

    ElNotification.success('知识库重命名成功！')
  } else if (activeTab.value === 'delete') {
    // 处理删除逻辑
    if (currentRowIndex.value >= 0 && currentRowIndex.value < tableData.value.length) {
      tableData.value.splice(currentRowIndex.value, 1) // 删除指定行的知识库
    }
    ElNotification.success('知识库删除成功！')
  }
  closeStoreOperationDialog()
}

// 查询知识库
function searchStore() {
  // 检验时间是否前后矛盾
  if (startDate.value && endDate.value) {
    const start = new Date(startDate.value)
    const end = new Date(endDate.value)
    
    if (start > end) {
      ElNotification.error('起始日期不能晚于结束日期')
      return
    }
  }
  
  // 这里可以添加其他查询逻辑
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

/* 侧边栏样式 */
.sidebar {
  width: 220px;
  background: #334b5e;
  color: #fff;
  overflow-y: auto;
}

/* 用户信息盒子样式 */
.user-info-box {
  height: 80px;
  margin: 16px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
}
.user-name {
  font-size: 18px;
  color: #222129;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
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

/* 面包屑样式 */
.breadcrumb-container {
  margin: 0;
  padding: 16px 20px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border: 1px solid #dee2e6;
  border-radius: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid #dee2e6;
}

.breadcrumb-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.breadcrumb {
  margin: 0;
  font-family: 'Segoe UI', 'Microsoft YaHei', 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px;
  font-weight: 500;
  color: #495057;
}

/* 面包屑项样式 */
:deep(.el-breadcrumb__item) {
  font-size: 16px;
  font-weight: 500;
}

:deep(.el-breadcrumb__inner) {
  color: #495057;
  font-weight: 500;
  transition: color 0.3s ease;
}

:deep(.el-breadcrumb__inner:hover) {
  color: #007bff;
}

:deep(.el-breadcrumb__separator) {
  color: #6c757d;
  font-weight: 400;
  margin: 0 8px;
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

/* 图标样式 */
.folder-icon {
  color: #ffa500;
  margin-right: 8px;
  font-size: 18px;
}

.document-icon {
  color: #1890ff;
  margin-right: 8px;
  font-size: 18px;
}

.action-icon {
  color: #666;
  font-size: 16px;
  cursor: pointer;
  transition: color 0.3s ease;
}

.action-icon:hover {
  color: #1890ff;
}

/* 菜单项样式 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 操作对话框样式 */
:deep(.el-tabs__header) {
  margin-bottom: 0;
}

:deep(.el-tabs__content) {
  padding: 20px 0;
}

:deep(.el-tab-pane) {
  min-height: 150px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>