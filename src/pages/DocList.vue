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
    <Sidebar :user-name="userName" :active-menu="activeMenu" :recent-docs="recentDocs" :knowledge-base-options="knowledgeBaseOptions"
      @menu-select="handleMenuSelect" @create-document="handleCreateDocument" />

    <!-- 主内容区 -->
    <el-container class="main-container">
      <el-header class="main-header" />

      <!--
        面包屑导航和搜索区域 - 功能：页面导航、文档搜索筛选、快速新建
        包含：面包屑导航、名称搜索、所有者搜索、日期范围筛选、查询按钮、新建文档按钮
      -->
      <div class="breadcrumb-container">
        <div class="breadcrumb-wrapper">
          <el-text class="mx-1" size="large">{{ kbName }}</el-text>
          <div class="search-item">
            <el-text size="large">名称</el-text>
            <el-input v-model="nameInput" size="" style="width: 100px" placeholder="输入名称" />
          </div>
          <div class="search-item">
            <el-text size="large">所有者</el-text>
            <el-input v-model="owerInput" style="width: 100px" placeholder="输入所有者" />
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
          <el-button type="info" round @click="searchDoc">查询</el-button>
          <el-button type="info" round v-show="false" @click="openCreateDocument">新建文档</el-button>
        </div>
      </div>

      <el-main class="main-content">
        <!--
          文档列表展示区 - 功能：以表格形式展示所有文档信息
          包含：文档名称、所有者、最近查看时间、操作按钮（重命名/删除）
        -->
        <div class="content-box">
          <el-table :data="currentPageData" style="width: 100%" @row-click=enterEdit>
            <el-table-column prop="name" label="名称" width="300" />
            <el-table-column prop="owner" label="所有者" width="300" />
            <el-table-column prop="date" label="最近查看">
              <template #default="scope">
                {{ scope.row.date ? scope.row.date.slice(0, 10) : '' }}
              </template>
            </el-table-column>
            <el-table-column prop="" label="操作" width="80">
              <template #default="scope">
                <el-icon class="action-icon" @click.stop="openDocOperationDialog(scope.$index)">
                  <MoreFilled />
                </el-icon>
              </template>
            </el-table-column>
          </el-table>
          <!-- 分页 -->
          <div class="pagination-wrapper">
            <el-pagination background layout="prev, pager, next" :total="tableData.length" :page-size="pageSize"
              :current-page="currentPage" @current-change="handleCurrentChange" />
          </div>
        </div>
      </el-main>
      <el-footer class="main-footer">Element Plus ©2024 Created by 代码全都队</el-footer>
    </el-container>
  </el-container>

  <!--
    文档操作对话框 - 功能：对选中文档进行重命名或删除操作
    包含：重命名标签页（输入新名称）、删除标签页（确认删除操作）
  -->
  <el-dialog v-model="docOperationDialogVisible" title="文档操作" width="500px" :close-on-click-modal="false">
    <el-tabs v-model="activeTab" type="card">
      <!-- 重命名标签页 -->
      <el-tab-pane label="重命名" name="rename">
        <el-form :model="renameForm" label-width="100px" style="margin-top: 20px;">
          <el-form-item label="新名称" required>
            <el-input v-model="renameForm.newName" placeholder="请输入新的文档名称" maxlength="50" show-word-limit />
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
          <el-input v-model="deleteForm.confirmText" placeholder="请输入 'DELETE' 确认删除" style="width: 300px;" />
        </div>
      </el-tab-pane>
    </el-tabs>

    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDocOperationDialog">取消</el-button>
        <el-button v-if="activeTab === 'delete'" type="danger" @click="handleDocOperation"
          :disabled="deleteForm.confirmText !== 'DELETE'">
          删除
        </el-button>
        <el-button v-else type="primary" @click="handleDocOperation">
          确定
        </el-button>
      </span>
    </template>
  </el-dialog>

  <!--
    新建文档对话框 - 功能：创建新的文档
    包含：文档名称输入、所属知识库选择
  -->
  <el-dialog v-model="createDocDialogVisible" title="新建文档" width="500px" :close-on-click-modal="false">
    <el-form :model="createForm" label-width="100px">
      <el-form-item label="文档名称" required>
        <el-input v-model="createForm.name" placeholder="请输入文档名称" maxlength="50" show-word-limit />
      </el-form-item>
      <el-form-item label="所属知识库" required>
        <el-select v-model="createForm.knowledgeBaseId" placeholder="请选择知识库" style="width: 100%">
          <el-option v-for="item in knowledgeBaseOptions" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeCreateDocDialog">取消</el-button>
        <el-button type="primary" @click="createDocument">创建</el-button>
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
import createdocument, { deleteDocument, getDocumentByuserId, getDocumentsByKnowledgeBase, renameDocument, searchDocument } from '@/api/document'
import { getKnowledgeBaseList } from '@/api/knowledgeBase'
import Sidebar from '@/pages/sideBarComponent/Sidebar.vue'
import { useUserStore } from '@/stores/user'
import { MoreFilled, Warning } from '@element-plus/icons-vue'
import { ElNotification } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
const router = useRouter()
// 获取用户store
const userStore = useUserStore()

// 获取路由参数
const route = useRoute()

// 知识库名称（从路由参数获取）
const kbName = ref('我的文档')
const kbOwner = ref('')

const userName = ref('代码全都队')
// 当前激活菜单项
const activeMenu = ref('1-2')

// 知识库选项
const knowledgeBaseOptions = ref<{ value: string; label: string }[]>([])

// 页面加载时获取知识库列表
getKnowledgeBaseList(userStore.userInfo.username).then(res => {
  if (res.data && Array.isArray(res.data.data)) {
    console.log('知识库后端返回数据:', res.data.data)
    knowledgeBaseOptions.value = res.data.data.map((item: { kbId?: string | number; kbName?: string }) => ({
      value: String(item.kbId ?? ''),
      label: String(item.kbName ?? '')
    }))
  }
})

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
const createForm = ref({
  name: '',
  knowledgeBaseId: '',
})

// 文档操作对话框相关
const docOperationDialogVisible = ref(false)
const activeTab = ref('rename')
const currentRowIndex = ref(-1)// 当前选中的行索引
const renameForm = ref({
  newName: ''
})
const deleteForm = ref({
  confirmText: ''
})

// 定义文档数据类型接口
interface DocumentItem {
  id: number
  name: string
  owner: string
  date: string
  [key: string]: any
}

// 定义最近文档数据类型接口
interface RecentDocument {
  id: number
  name: string
  [key: string]: any
}

//文档列表
const tableData = ref<DocumentItem[]>([])

// 最近文档列表
const recentDocs = ref<RecentDocument[]>([])

// 分页相关
const pageSize = ref(10)
const currentPage = ref(1)

// 计算当前页显示的数据
const currentPageData = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return tableData.value.slice(start, end)
})

function handleCurrentChange(newPage: number) {
  currentPage.value = newPage
}

onMounted(() => {
  // 处理路由参数
  if (route.query.kbName) {
    kbName.value = route.query.kbName as string
    kbOwner.value = route.query.kbOwner as string
  }

  // 根据知识库信息获取文档列表
  if (kbName.value !== '我的文档') {
    // 先通过知识库名称获取知识库ID
    getKnowledgeBaseList(userStore.userInfo.username).then(kbRes => {
      const targetKb = kbRes.data.data.find((kb: { kbId: number; kbName: string }) => kb.kbName === kbName.value)

      if (targetKb) {
        // 使用知识库ID获取文档列表
        getDocumentsByKnowledgeBase(targetKb.kbId).then(res => {
          console.log('知识库文档列表:', res.data.data.list)
          tableData.value = res.data.data.list;
          currentPage.value = 1
        }).catch(() => {
          ElNotification.error('获取知识库文档失败')
        })
      } else {
        ElNotification.error('未找到指定的知识库')
      }
    })
  } else {
    // 获取所有文档
    getDocumentByuserId(useUserStore().userInfo.userId).then(res => {
      // console.log(res.data.data.list)
      // // 弹窗显示list内容
      // ElMessageBox.alert(
      //   `<pre>${JSON.stringify(res.data.data.list, null, 2)}</pre>`,
      //   '文档列表list内容',
      //   {
      //     dangerouslyUseHTMLString: true,
      //     confirmButtonText: '确定'
      //   }
      // )
      tableData.value = res.data.data.list;
      currentPage.value = 1
    });
  }
})

/**
 * 菜单选择事件
 */
function handleMenuSelect() {

}

// 页面跳转row
function enterEdit(row: any) {
  console.log(row)
  router.push({
    path: `/test`,
    query: {
      id: row.id
    }
  })
}
/**console.log(docId)
 * 处理创建文档事件(侧边栏的文档操作按钮触发)
 * @param documentData 文档数据
 */
function handleCreateDocument(documentData: any) {
  // 创建新文档对象

  // 将新文档添加到列表开头
  tableData.value.unshift(documentData)
}

/**
 * 打开新建文档对话框（从面包屑按钮触发）
 */
function openCreateDocument() {
  createDocDialogVisible.value = true
  // 重置表单
  createForm.value = {
    name: '',
    knowledgeBaseId: '',
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

function createDocument() {
  if (!createForm.value.name.trim()) {
    ElNotification.warning('请输入文档名称')
    return
  }

  if (!createForm.value.knowledgeBaseId) {
    ElNotification.warning('请选择所属知识库')
    return
  }

  // 通过知识库名查找kbId

  // 像后端发送请求
  // 触发创建文档事件，传递number类型的kbIdId
  createdocument({
    docName: createForm.value.name,
    kbId: <any>(createForm.value.knowledgeBaseId),//要根据知识库的名称找到对应知识库id
    userId: userStore.userInfo.userId,
    isCollaborative: false
  }).then(res => {
    console.log(res.data.data)
    handleCreateDocument(res.data.data)

  })

  // 显示成功提示
  ElNotification.success('文档创建成功！')

  // 关闭对话框
  closeCreateDocDialog()
}

/**
 * 打开文档操作对话框
 */
function openDocOperationDialog(index: number) {
  docOperationDialogVisible.value = true
  renameForm.value.newName = ''
  deleteForm.value.confirmText = ''
  currentRowIndex.value = index
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
    if (!renameForm.value.newName.trim()) {
      ElNotification.warning('请输入新的文档名称')
      return
    }
    if (currentRowIndex.value >= 0 && currentRowIndex.value < tableData.value.length) {
      const oldName = tableData.value[currentRowIndex.value].name
      const newName = renameForm.value.newName
      // 调用后端重命名接口
      renameDocument(oldName, newName).then((res) => {
        tableData.value[currentRowIndex.value].name = newName
        ElNotification.success('文档重命名成功！')
        closeDocOperationDialog()
      }).catch(() => {
        ElNotification.error('文档重命名失败')
      })
    }
  } else if (activeTab.value === 'delete') {
    // 处理删除逻辑
    if (currentRowIndex.value >= 0 && currentRowIndex.value < tableData.value.length) {
      const docName = tableData.value[currentRowIndex.value].name
      // 调用后端删除接口
      deleteDocument(docName).then((res) => {
        tableData.value.splice(currentRowIndex.value, 1)
        ElNotification.success('文档删除成功！')
        closeDocOperationDialog()
      }).catch(() => {
        ElNotification.error('文档删除失败')
      })
    }
  }
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
  searchDocument(nameInput.value, owerInput.value, startDate.value, endDate.value).then(res => {
    console.log("chaxun ", res.data.data.list)
    tableData.value.splice(0, tableData.value.length)
    console.log(tableData.value)
    tableData.value = res.data.data.list
    console.log(tableData.value)
  })
}
</script>

<style scoped>
/* 分页栏居中并与表格间距 */
.pagination-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 24px;
}

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
