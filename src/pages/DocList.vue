<template>
  <!--
    文档列表页面（DocList.vue）
    功能：展示用户的所有文档，支持搜索、筛选、新建、重命名、删除等操作
    包含：侧边栏导航、面包屑搜索、文档表格、操作对话框
  -->
  <el-container class="home-container">
    <!--
      侧边栏组件 - 功能：用户信息展示、菜单导航、最近文档、快速创建文档
      包含：用户头像和名称、知识库和文档菜单、最近访问文档列表、新建文档按钮
    -->
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

      <!--
        面包屑导航和搜索区域 - 功能：页面导航、文档搜索筛选、快速新建
        包含：面包屑导航、名称搜索、所有者搜索、日期范围筛选、查询按钮、新建文档按钮
      -->
      <div class="breadcrumb-container">
        <div class="breadcrumb-wrapper">
          <el-text class="mx-1" size="large">我的文档</el-text>
          <div class="search-item">
            <el-text size="large">名称</el-text>
            <el-input v-model="nameInput" size= "" style="width: 100px" placeholder="输入名称" />
          </div>
          <div class="search-item">
            <el-text size="large">所有者</el-text>
            <el-input v-model="owerInput" style="width: 100px" placeholder="输入所有者" />
          </div>
          <div class="search-item">
            <el-text size="large">起始日期</el-text>
            <el-date-picker
              v-model="startDate"
              type="date"
              placeholder="起始日期"
              style="width: 120px"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </div>
          <div class="search-item">
            <el-text size="large">结束日期</el-text>
            <el-date-picker
              v-model="endDate"
              type="date"
              placeholder="结束日期"
              style="width: 120px"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </div>
          <el-button type="info" round @click="searchDoc">查询</el-button>
          <el-button type="info" round @click="openCreateDocument">新建文档</el-button>
        </div>
      </div>

      <el-main class="main-content">
        <!--
          文档列表展示区 - 功能：以表格形式展示所有文档信息
          包含：文档名称、所有者、最近查看时间、操作按钮（重命名/删除）
        -->
        <div class="content-box">
          <el-table :data="tableData" style="width: 100%">
            <el-table-column prop="name" label="名称" width="300" />
            <el-table-column prop="owner" label="所有者" width="300" />
            <el-table-column prop="date" label="最近查看" />
            <el-table-column prop="action" label="操作" width="80">
              <template #default>
                <el-icon class="action-icon" @click="openDocOperationDialog">
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

  <!--
    文档操作对话框 - 功能：对选中文档进行重命名或删除操作
    包含：重命名标签页（输入新名称）、删除标签页（确认删除操作）
  -->
  <el-dialog
    v-model="docOperationDialogVisible"
    title="文档操作"
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
              placeholder="请输入新的文档名称"
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
            您确定要删除这个文档吗？此操作不可恢复。
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
        <el-button @click="closeDocOperationDialog">取消</el-button>
        <el-button
          v-if="activeTab === 'delete'"
          type="danger"
          @click="handleDocOperation"
          :disabled="deleteForm.confirmText !== 'DELETE'"
        >
          删除
        </el-button>
        <el-button
          v-else
          type="primary"
          @click="handleDocOperation"
        >
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>

  <!--
    新建文档对话框 - 功能：创建新的文档
    包含：文档名称输入、所属知识库选择
  -->
  <el-dialog
      v-model="createDocDialogVisible"
      title="新建文档"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="createDocForm" label-width="100px">
        <el-form-item label="文档名称" required>
          <el-input
            v-model="createDocForm.name"
            placeholder="请输入文档名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="所属知识库" required>
          <el-select v-model="createDocForm.knowledgeBase" placeholder="请选择知识库" style="width: 100%">
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
          <el-button @click="closeCreateDocDialog">取消</el-button>
          <el-button type="primary" @click="createDoc">创建</el-button>
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
import Sidebar from '@/pages/sideBarComponent/Sidebar.vue'
import { MoreFilled, Warning } from '@element-plus/icons-vue'
import { ElNotification } from 'element-plus'
import { ref } from 'vue'

const userName = ref('代码全都队')
// 当前激活菜单项
const activeMenu = ref('1-2')
// 最近文档列表
const recentDocs = ref([
  '文档A', '文档B', '文档C', '文档D', '文档E', '文档F', '文档G', '文档H'
])

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

// 输入名称
const nameInput = ref('')
// 输入所有者
const owerInput = ref('')
// 起始日期
const startDate = ref('')
// 结束日期
const endDate = ref('')

// 新建文档对话框相关
const createDocDialogVisible = ref(false)
const createDocForm = ref({
  name: '',
  knowledgeBase: '',
})

// 文档操作对话框相关
const docOperationDialogVisible = ref(false)
const activeTab = ref('rename')
const renameForm = ref({
  newName: ''
})
const deleteForm = ref({
  confirmText: ''
})

//文档列表
const tableData = ref([
  {
    name: '文档A',
    owner: '张三',
    date: '2025-06-15',
    action: '操作',
  },
  {
    name: '文档B',
    owner: '李四',
    date: '2025-06-15',
    action: '操作',
  },
  {
    name: '文档C',
    owner: '王五',
    date: '2025-06-15',
    action: '操作',
  }
])

/**
 * 菜单选择事件
 */
function handleMenuSelect() {

}

/**
 * 处理创建文档事件(侧边栏的文档操作按钮触发)
 * @param documentData 文档数据
 */
function handleCreateDocument(documentData: { name: string; knowledgeBase: string }) {
  // 创建新文档对象
  const newDocument = {
    name: documentData.name,
    owner: '默认',
    date: new Date().toISOString().split('T')[0], // 当前日期，格式：YYYY-MM-DD
    action: '操作'
  }

  // 将新文档添加到列表开头
  tableData.value.unshift(newDocument)
}

/**
 * 打开新建文档对话框（从面包屑按钮触发）
 */
function openCreateDocument() {
  createDocDialogVisible.value = true
  // 重置表单
  createDocForm.value = {
    name: '',
    knowledgeBase: '',
  }
}

/**
 * 关闭新建文档对话框
 */
function closeCreateDocDialog() {
  createDocDialogVisible.value = false
}

/**
 * 创建文档（面包屑按钮触发的对话框）
 */
function createDoc() {
  if (!createDocForm.value.name.trim()) {
    ElNotification.warning('请输入文档名称')
    return
  }

  if (!createDocForm.value.knowledgeBase) {
    ElNotification.warning('请选择所属知识库')
    return
  }

  // 创建新文档对象
  const newDocument = {
    name: createDocForm.value.name,
    owner: '默认',
    date: new Date().toISOString().split('T')[0], // 当前日期，格式：YYYY-MM-DD
    action: '操作'
  }

  // 将新文档添加到列表开头
  tableData.value.unshift(newDocument)

  // 显示成功提示
  ElNotification.success('文档创建成功！')

  // 关闭对话框
  closeCreateDocDialog()
}

/**
 * 打开文档操作对话框
 */
function openDocOperationDialog() {
  docOperationDialogVisible.value = true
  renameForm.value.newName = ''
  deleteForm.value.confirmText = ''
}

/**
 * 关闭文档操作对话框
 */
function closeDocOperationDialog() {
  docOperationDialogVisible.value = false
}

/**
 * 处理文档操作
 */
function handleDocOperation() {
  if (activeTab.value === 'rename') {
    // 处理重命名逻辑
    ElNotification.success('文档重命名成功！')
  } else if (activeTab.value === 'delete') {
    // 处理删除逻辑
    ElNotification.success('文档删除成功！')
  }
  closeDocOperationDialog()
}

// 查询文档
function searchDoc() {
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
  gap: 8px;
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

/* 搜索项样式 - 让文字和组件紧凑挨着 */
.search-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.search-item .el-text {
  margin: 0;
  white-space: nowrap;
}

.search-item .el-input,
.search-item .el-date-picker {
  margin: 0;
}

/* 按钮间距调整 */
.breadcrumb-wrapper .el-button {
  margin-left: 8px;
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

/* 操作图标样式 */
.action-icon {
  color: #666;
  font-size: 16px;
  cursor: pointer;
  transition: color 0.3s ease;
}

.action-icon:hover {
  color: #1890ff;
}

/* 对话框样式 */
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
