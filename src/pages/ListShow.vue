<script setup lang="ts">
import { ref } from 'vue'
import type { CollapseModelValue } from 'element-plus'
import { ElMessageBox, ElMessage } from 'element-plus'

const activeNames = ref(['1'])

const handleChange = (val: CollapseModelValue) => {
  console.log(val)
}

// 对话框相关
const dialogVisible = ref(false)
const newDocumentName = ref('')
const currentStoreId = ref('')

// 重命名对话框相关
const renameDialogVisible = ref(false)
const renameDocumentName = ref('')
const currentDocumentId = ref('')
const currentDocumentStoreId = ref('')

// 添加知识库对话框相关
const addStoreDialogVisible = ref(false)
const newStoreName = ref('')

// 知识库数据
const knowledgeStores = ref([
  {
    id: '1',
    title: '计算机网络',
    documents: [
      {
        id: '1-1',
        name: '应用层知识文档'
      },
      {
        id: '1-2',
        name: '传输层知识文档'
      }
    ]
  },
  {
    id: '2',
    title: '数据结构',
    documents: [
      {
        id: '2-1',
        name: '二叉树知识文档'
      }
    ]
  }
])

// 打开添加文档对话框
const openAddDialog = (storeId: string) => {
  currentStoreId.value = storeId
  newDocumentName.value = ''
  dialogVisible.value = true
}

// 添加新文档
const addDocument = () => {
  if (newDocumentName.value.trim()) {
    const store = knowledgeStores.value.find(s => s.id === currentStoreId.value)
    if (store) {
      const newId = `${store.id}-${store.documents.length + 1}`
      store.documents.push({
        id: newId,
        name: newDocumentName.value.trim()
      })
      dialogVisible.value = false
      newDocumentName.value = ''
    }
  }
}

// 取消添加
const cancelAdd = () => {
  dialogVisible.value = false
  newDocumentName.value = ''
}

// 打开重命名对话框
const openRenameDialog = (storeId: string, documentId: string, currentName: string) => {
  currentDocumentStoreId.value = storeId
  currentDocumentId.value = documentId
  renameDocumentName.value = currentName
  renameDialogVisible.value = true
}

// 重命名文档
const renameDocument = () => {
  if (renameDocumentName.value.trim()) {
    const store = knowledgeStores.value.find(s => s.id === currentDocumentStoreId.value)
    if (store) {
      const document = store.documents.find(d => d.id === currentDocumentId.value)
      if (document) {
        document.name = renameDocumentName.value.trim()
        renameDialogVisible.value = false
        renameDocumentName.value = ''
      }
    }
  }
}

// 取消重命名
const cancelRename = () => {
  renameDialogVisible.value = false
  renameDocumentName.value = ''
}

// 打开添加知识库对话框
const openAddStoreDialog = () => {
  newStoreName.value = ''
  addStoreDialogVisible.value = true
}

// 添加新知识库
const addStore = () => {
  if (newStoreName.value.trim()) {
    const newId = String(knowledgeStores.value.length + 1)
    knowledgeStores.value.push({
      id: newId,
      title: newStoreName.value.trim(),
      documents: []
    })
    addStoreDialogVisible.value = false
    newStoreName.value = ''
    ElMessage({
      type: 'success',
      message: '知识库添加成功',
    })
  }
}

// 取消添加知识库
const cancelAddStore = () => {
  addStoreDialogVisible.value = false
  newStoreName.value = ''
}

// 删除知识库
const deleteStore = (storeId: string) => {
  const store = knowledgeStores.value.find(s => s.id === storeId)
  if (store) {
    ElMessageBox.confirm(
      `确定要删除知识库"${store.title}"吗？这将同时删除该知识库下的所有文档！`,
      '确认删除',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )
      .then(() => {
        const storeIndex = knowledgeStores.value.findIndex(s => s.id === storeId)
        if (storeIndex !== -1) {
          knowledgeStores.value.splice(storeIndex, 1)
          ElMessage({
            type: 'success',
            message: '知识库删除成功',
          })
        }
      })
      .catch(() => {
        // 用户取消删除
      })
  }
}

// 删除文档
const deleteDocument = (storeId: string, documentId: string) => {
  const store = knowledgeStores.value.find(s => s.id === storeId)
  if (store) {
    const document = store.documents.find(d => d.id === documentId)
    if (document) {
      ElMessageBox.confirm(
        `确定要删除文档"${document.name}"吗？`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
        .then(() => {
          const documentIndex = store.documents.findIndex(d => d.id === documentId)
          if (documentIndex !== -1) {
            store.documents.splice(documentIndex, 1)
            ElMessage({
              type: 'success',
              message: '删除成功',
            })
          }
        })
        .catch(() => {
          // 用户取消删除
        })
    }
  }
}
</script>

<template>
  <div class="container">
    <el-text class="mx-1" size="large" type="primary">知识库列表</el-text>
    <el-button type="primary" size="small" @click="openAddStoreDialog">新建</el-button>
  </div>

  <div class="demo-collapse">
    <el-collapse v-model="activeNames" @change="handleChange">
      <div class="knowledge-store">
        <el-collapse-item 
          v-for="store in knowledgeStores" 
          :key="store.id"
          :name="store.id"
        >
          <template #title>
            <div class="collapse-title">
              <span>{{ store.title }}</span>
              <div class="title-buttons">
                <el-button 
                  type="primary" 
                  size="small" 
                  @click.stop="openAddDialog(store.id)"
                >
                  新建
                </el-button>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click.stop="deleteStore(store.id)"
                >
                  删除
                </el-button>
              </div>
            </div>
          </template>
          <div class="document-container">
            <div 
              v-for="document in store.documents" 
              :key="document.id"
              class="document"
            >
              {{ document.name }}
              <div class="button-group">
                <el-button type="primary" size="small" @click="openRenameDialog(store.id, document.id, document.name)">重命名</el-button>
                <el-button type="danger" size="small" @click="deleteDocument(store.id, document.id)">删除</el-button>
              </div>
            </div>
          </div>
        </el-collapse-item>
      </div>
    </el-collapse>
  </div>

  <!-- 添加文档对话框 -->
  <el-dialog
    v-model="dialogVisible"
    title="添加新文档"
    width="400px"
  >
    <el-form>
      <el-form-item label="文档名称">
        <el-input 
          v-model="newDocumentName" 
          placeholder="请输入文档名称"
          @keyup.enter="addDocument"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancelAdd">取消</el-button>
        <el-button type="primary" @click="addDocument">确定</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 重命名对话框 -->
  <el-dialog
    v-model="renameDialogVisible"
    title="重命名文档"
    width="400px"
  >
    <el-form>
      <el-form-item label="新文档名称">
        <el-input 
          v-model="renameDocumentName" 
          placeholder="请输入新文档名称"
          @keyup.enter="renameDocument"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancelRename">取消</el-button>
        <el-button type="primary" @click="renameDocument">确定</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 添加知识库对话框 -->
  <el-dialog
    v-model="addStoreDialogVisible"
    title="添加新知识库"
    width="400px"
  >
    <el-form>
      <el-form-item label="知识库名称">
        <el-input 
          v-model="newStoreName" 
          placeholder="请输入知识库名称"
          @keyup.enter="addStore"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="cancelAddStore">取消</el-button>
        <el-button type="primary" @click="addStore">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.demo-collapse {
  margin-top: 20px;
}

.collapse-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.title-buttons {
  display: flex;
  gap: 8px;
}

.document-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.document {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.document .button-group {
  display: flex;
  gap: 12px;
}
</style>