<template>
  <!--
    Home1页面（Element Plus 版）
    用Element Plus组件实现侧边栏、用户信息、菜单、内容区、面包屑和页脚。
    结构与Home.vue一致，风格统一，便于维护。
  -->
  <el-container class="home-container">
    <!-- 使用可复用的侧边栏组件 -->
    <Sidebar :user-name="userName" :active-menu="activeMenu" :recent-docs="recentDocs"
      :knowledge-base-options="knowledgeBaseOptions" @menu-select="handleMenuSelect"
      @create-document="handleCreateDocument" />
    <!-- 主内容区 -->
    <el-container class="main-container">
      <el-header class="main-header" />
      <!-- 面包屑导航 -->
     <div class="breadcrumb-container">
        <div class="breadcrumb-wrapper">
          <el-text class="mx-1" size="large">我的知识库</el-text>
          <div class="search-item">
            <el-text size="large">名称</el-text>
            <el-input v-model="nameInput" style="width: 100px" placeholder="输入名称" />
          </div>
          <div class="search-item">
            <el-text size="large">所有者</el-text>
            <el-input v-model="onwerInput" style="width: 100px" placeholder="输入所有者" />
          </div>
          <div class="search-item">
            <el-text size="large">起始日期</el-text>
            <el-date-picker v-model="startDate" type="date" placeholder="起始日期" style="width: 120px" format="YYYY-MM-DD"
              value-format="YYYY-MM-DD" />
          </div>
          <div class="search-item">
            <el-text size="large">结束日期</el-text>
            <el-date-picker v-model="endDate" type="date" placeholder="结束日期" style="width: 120px" format="YYYY-MM-DD"
              value-format="YYYY-MM-DD" />
          </div>
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
          <!-- 分页 -->
          <div class="pagination-wrapper">
            <el-pagination background layout="prev, pager, next" :total="1000" />
          </div>
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
    <el-form :model="createForm" :rules="createFormRules" ref="createFormRef" label-width="100px">
      <el-form-item label="知识库名称" prop="name" required>
        <el-input
          v-model="createForm.name"
          placeholder="请输入知识库名称"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="编辑者" prop="editors">
        <el-select v-model="createForm.editors" multiple placeholder="请选择编辑者">
          <el-option v-for="item in editorsOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeCreateKnowledgeBaseDialog">取消</el-button>
        <el-button type="primary" @click="createKnowledgeBase">创建</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 知识库操作对话框 -->
  <el-dialog v-model="storeOperationDialogVisible" title="知识库操作" width="500px" :close-on-click-modal="false">
    <el-tabs v-model="activeTab" type="card">
      <!-- 重命名标签页 -->
      <el-tab-pane label="重命名" name="rename">
        <el-form :model="renameForm" label-width="100px" style="margin-top: 20px;">
          <el-form-item label="新名称" required>
            <el-input v-model="renameForm.newName" placeholder="请输入新的知识库名称" maxlength="50" show-word-limit />
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
          <el-input v-model="deleteForm.confirmText" placeholder="请输入 'DELETE' 确认删除" style="width: 300px;" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeStoreOperationDialog">取消</el-button>
        <el-button v-if="activeTab === 'delete'" type="danger" @click="handleStoreOperation"
          :disabled="deleteForm.confirmText !== 'DELETE'">
          删除
        </el-button>
        <el-button v-else type="primary" @click="handleStoreOperation">
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
import Sidebar from '@/pages/sideBarComponent/Sidebar.vue'
import { MoreFilled, Warning } from '@element-plus/icons-vue'
import { ElNotification } from 'element-plus'
import { ref, onMounted, computed } from 'vue'
// import { useRouter } from 'vue-router'
import { getKnowledgeBaseList, addKnowledgeBase, getAllUsers, renameKnowledgeBase, deleteKnowledgeBase, searchKnowledgeBase } from '@/api/knowledgeBase'
import { useUserStore } from '@/stores/user'

// 获取用户store
const userStore = useUserStore()

// 侧边栏相关数据
const userName = ref('代码全都队')
const activeMenu = ref('1-1')
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
  editors: [] as string[], // 支持多选
})

// 新建知识库表单校验规则
const createFormRules = {
  name: [
    { required: true, message: '请输入知识库名称', trigger: 'blur' }
  ]
}

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

// 定义知识库项类型
interface KnowledgeBaseItem {
  name: string
  owner: string
  date: string
  action: string
}

//知识库列表
const tableData = ref<KnowledgeBaseItem[]>([])

// 侧边栏显示用户名逻辑，与Sidebar一致
const displayUserName = computed(() => {
  const name = userStore.isGuest ? '游客用户' : (userStore.userInfo.nickname || userStore.userInfo.username)
  return name.length > 7 ? name.substring(0, 7) + '...' : name
})

// 编辑者下拉菜单选项
const editorsOptions = ref<{ label: string; value: string }[]>([])

onMounted(async () => {
  try {
    const res = await getKnowledgeBaseList(userStore.userInfo.username)
    tableData.value = res.data.data.map((item: { kbName: string; userName: string; accessTime: string }) => ({
      name: item.kbName,         // 映射为前端需要的字段
      owner: item.userName,
      date: item.accessTime,
      action: '操作',
      // 其他字段按需添加r
    }))
  } catch {
    ElNotification.error('知识库数据加载失败')
  }
})

/**
 * 菜单选择事件
 */
function handleMenuSelect() {}

/**
 * 处理创建文档事件（来自侧边栏组件）
 */
function handleCreateDocument() {}

/**
 * 打开新建知识库对话框
 */
function openCreateDialog() {
  createDialogVisible.value = true
  // 重置表单
  createForm.value = {
    name: '',
    editors: [],
  }
  // 重置校验
  if (createFormRef.value) createFormRef.value.clearValidate()
  // 动态获取所有用户名作为下拉菜单选项
  getAllUsers().then(res => {
    // 过滤掉与侧边栏用户名相同的项
    const currentUser = displayUserName.value;
    editorsOptions.value = (res.data.data || []).filter((username: string) => username !== currentUser).map((username: string) => ({
      label: username,
      value: username
    }))
  })
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
  // 表单校验
  createFormRef.value?.validate(async (valid: boolean) => {
    if (!valid) {
      ElNotification.warning('请完善表单信息')
      return
    }
    // 组装新知识库数据
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const newKnowledgeBase = {
      name: createForm.value.name,
      owner: displayUserName.value,
      date: dateStr,
      action: '操作',
      editors: createForm.value.editors.join(', '), // 仅做展示
    }
    // 添加到表格
    tableData.value.unshift(newKnowledgeBase)
    // 发起请求，传递新建知识库信息给后端
    try {
      await addKnowledgeBase({
        name: createForm.value.name,
        owner: displayUserName.value,
        date: dateStr,
        editors: createForm.value.editors
      })
      ElNotification.success('知识库创建成功！')
    } catch {
      ElNotification.error('知识库创建失败')
    }
    // 关闭对话框
    closeCreateKnowledgeBaseDialog()
  })
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
    if (currentRowIndex.value >= 0 && currentRowIndex.value < tableData.value.length) {
      const oldName = tableData.value[currentRowIndex.value].name
      const newName = renameForm.value.newName
      // 调用后端重命名接口
      renameKnowledgeBase(oldName, newName).then(() => {
        tableData.value[currentRowIndex.value].name = newName
        ElNotification.success('知识库重命名成功！')
        closeStoreOperationDialog()
      }).catch(() => {
        ElNotification.error('知识库重命名失败')
      })
    }
  } else if (activeTab.value === 'delete') {
    if (currentRowIndex.value >= 0 && currentRowIndex.value < tableData.value.length) {
      const name = tableData.value[currentRowIndex.value].name
      // 调用后端删除接口
      deleteKnowledgeBase(name).then(() => {
        tableData.value.splice(currentRowIndex.value, 1)
        ElNotification.success('知识库删除成功！')
        closeStoreOperationDialog()
      }).catch(() => {
        ElNotification.error('知识库删除失败')
      })
    }
  }
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
  // 发起后端查询请求
  searchKnowledgeBase({
    name: nameInput.value,
    owner: onwerInput.value,
    startDate: startDate.value,
    endDate: endDate.value
  }).then(res => {
    // 假设后端返回格式与getKnowledgeBaseList一致
    tableData.value = (res.data.data || []).map((item: { kbName: string; userName: string; accessTime: string }) => ({
      name: item.kbName,
      owner: item.userName,
      date: item.accessTime,
      action: '操作',
    }))
    // 清空输入框
    nameInput.value = ''
    onwerInput.value = ''
    startDate.value = ''
    endDate.value = ''
  }).catch(() => {
    ElNotification.error('查询失败')
  })
}

// 新建知识库表单ref
const createFormRef = ref()
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

/* 分页栏居中并与表格间距 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
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
