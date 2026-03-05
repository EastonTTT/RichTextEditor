<template>
  <div class="wrapper">
    <input
      ref="importInput"
      type="file"
      accept=".doc,.docx,.pdf,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      class="hidden-input"
      @change="handleImportChange"
    />
    <div class="side-bar">
      <sideBar
        active-tab="documents"
        :user-name="user.name"
        :document-count="documents.length"
        :knowledge-base-count="knowledgeBases.length"
        :recent-documents="recentDocuments"
        :recent-knowledge-bases="recentKnowledgeBases"
        @logout="handleLogout"
        @navigate="router.push($event)"
        @open-recent-document="handleOpenDocument"
        @open-recent-knowledge-base="handleOpenKnowledgeBase"
      />
    </div>
    <div class="main-page">
      <mainPage
        :documents="filteredDocuments"
        :shared-documents="sharedDocuments"
        :filter="filter"
        :keyword="keyword"
        @create="handleCreateDocument"
        @import="handleImportEntry"
        @template="handleTemplateEntry"
        @open="handleOpenDocument"
        @rename="handleRenameDocument"
        @duplicate="handleDuplicateDocument"
        @delete="handleDeleteDocument"
        @update:filter="filter = $event"
        @update:keyword="keyword = $event"
      />
    </div>

    <el-dialog v-model="isTemplateDialogOpen" title="选择模板" width="760px">
      <div class="template-dialog">
        <div v-if="templates.length > 0" class="template-grid">
          <article v-for="template in templates" :key="template.id" class="template-card">
            <div class="template-title">{{ template.title }}</div>
            <div class="template-desc">{{ template.description }}</div>
            <div class="template-preview">{{ template.preview }}</div>
            <div class="template-meta">来源文档：{{ template.sourceDocumentId || '未记录' }}</div>
            <div class="template-actions">
              <el-button type="primary" @click="handleCreateFromTemplate(template.id)">使用模板</el-button>
              <el-button @click="handleDeleteTemplate(template.id)">删除模板</el-button>
            </div>
          </article>
        </div>
        <el-empty v-else description="当前还没有文档模板" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import sideBar from './components/sideBar.vue'
import mainPage from './components/mainPage.vue'
import {
  createDocumentFromTemplate,
  createDocument,
  duplicateDocument,
  getDocumentTemplates,
  getDocumentList,
  importDocument,
  getRecentDocuments,
  recordDocumentOpen,
  removeDocument,
  removeDocumentTemplate,
  saveDocument,
} from '@/api/document'
import { getKnowledgeBaseList, getRecentKnowledgeBases, recordKnowledgeBaseOpen } from '@/api/knowledgeBase'
import { getCurrentUser, logout } from '@/api/user'
import type { DocumentSummary, DocumentTemplateSummary, RecentDocumentItem } from '@/types/document'
import type { KnowledgeBaseSummary, RecentKnowledgeBaseItem } from '@/types/knowledgeBase'
import type { UserProfile } from '@/types/user'

defineOptions({
  name: 'homePage',
})

const router = useRouter()
const documents = ref<DocumentSummary[]>([])
const knowledgeBases = ref<KnowledgeBaseSummary[]>([])
const recentDocuments = ref<RecentDocumentItem[]>([])
const recentKnowledgeBases = ref<RecentKnowledgeBaseItem[]>([])
const templates = ref<DocumentTemplateSummary[]>([])
const isTemplateDialogOpen = ref(false)
const importInput = ref<HTMLInputElement | null>(null)
const user = ref<UserProfile>({
  id: '',
  name: '访客',
  color: '#1677ff',
})
const filter = ref('all')
const keyword = ref('')

function normalizeSearchText(value: string | undefined | null) {
  return `${value || ''}`
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

const normalizedKeyword = computed(() => normalizeSearchText(keyword.value))

const filteredDocuments = computed(() =>
  documents.value.filter((document) => {
    const matchFilter = filter.value === 'all' || document.visibility === filter.value
    if (!matchFilter) {
      return false
    }

    if (normalizedKeyword.value.length === 0) {
      return true
    }

    const searchableTitle = normalizeSearchText(document.title)
    if (searchableTitle.includes(normalizedKeyword.value)) {
      return true
    }

    const searchablePreview = normalizeSearchText(document.preview)
    if (searchablePreview.includes(normalizedKeyword.value)) {
      return true
    }

    const searchableOwner = normalizeSearchText(document.ownerName || document.author)
    if (searchableOwner.includes(normalizedKeyword.value)) {
      return true
    }

    const searchableContent = normalizeSearchText(document.content)
    return searchableContent.includes(normalizedKeyword.value)
  }),
)

const sharedDocuments = computed(() =>
  documents.value.filter((document) => {
    if (document.visibility !== 'shared') {
      return false
    }

    if (normalizedKeyword.value.length === 0) {
      return true
    }

    const searchableTitle = normalizeSearchText(document.title)
    if (searchableTitle.includes(normalizedKeyword.value)) {
      return true
    }

    const searchablePreview = normalizeSearchText(document.preview)
    if (searchablePreview.includes(normalizedKeyword.value)) {
      return true
    }

    const searchableOwner = normalizeSearchText(document.ownerName || document.author)
    if (searchableOwner.includes(normalizedKeyword.value)) {
      return true
    }

    const searchableContent = normalizeSearchText(document.content)
    return searchableContent.includes(normalizedKeyword.value)
  }),
)

async function loadData() {
  const [currentUser, currentDocuments, currentRecentDocuments, currentKnowledgeBases, currentRecentKnowledgeBases] =
    await Promise.all([
      getCurrentUser(),
      getDocumentList(),
      getRecentDocuments(),
      getKnowledgeBaseList(),
      getRecentKnowledgeBases(),
    ])
  user.value = currentUser
  documents.value = currentDocuments
  recentDocuments.value = currentRecentDocuments
  knowledgeBases.value = currentKnowledgeBases
  recentKnowledgeBases.value = currentRecentKnowledgeBases
}

async function handleCreateDocument() {
  const document = await createDocument({
    author: user.value.name,
    title: '未命名文档',
    content: '<h1>未命名文档</h1><p></p>',
  })

  await recordDocumentOpen(document.id)
  await loadData()
  router.push(`/documents/${document.id}`)
}

function handleImportEntry() {
  importInput.value?.click()
}

async function handleTemplateEntry() {
  templates.value = await getDocumentTemplates()
  isTemplateDialogOpen.value = true
}

async function handleOpenDocument(id: string) {
  await recordDocumentOpen(id)
  await loadData()
  router.push(`/documents/${id}`)
}

async function handleOpenKnowledgeBase(id: string) {
  await recordKnowledgeBaseOpen(id)
  await loadData()
  router.push(`/knowledge/${id}`)
}

async function handleRenameDocument(id: string) {
  const target = documents.value.find((document) => document.id === id)
  if (!target) {
    return
  }

  try {
    const { value } = await ElMessageBox.prompt('请输入新的文档标题。', '重命名文档', {
      inputValue: target.title,
      inputPattern: /\S+/,
      inputErrorMessage: '标题不能为空。',
      confirmButtonText: '保存',
    })

    await saveDocument(id, { title: value.trim() })
    await loadData()
    ElMessage.success('文档已重命名。')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重命名失败。')
    }
  }
}

async function handleDuplicateDocument(id: string) {
  const target = documents.value.find((document) => document.id === id)
  if (!target) {
    return
  }

  try {
    const duplicated = await duplicateDocument(id, {
      title: `${target.title} 副本`,
    })

    await recordDocumentOpen(duplicated.id)
    await loadData()
    ElMessage.success('文档已复制。')
    router.push(`/documents/${duplicated.id}`)
  } catch {
    ElMessage.error('复制文档失败。')
  }
}

async function handleDeleteDocument(id: string) {
  const target = documents.value.find((document) => document.id === id)
  if (!target) {
    return
  }

  try {
    await ElMessageBox.confirm(`确认删除“${target.title}”？该操作不可恢复。`, '删除文档', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })

    await removeDocument(id)
    await loadData()
    ElMessage.success('文档已删除。')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除文档失败。')
    }
  }
}

async function handleImportChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''

  if (!file) {
    return
  }

  try {
    const document = await importDocument(file)
    await recordDocumentOpen(document.id)
    await loadData()
    ElMessage.success('文档导入成功。')
    router.push(`/documents/${document.id}`)
  } catch {
    ElMessage.error('文档导入失败。')
  }
}

async function handleCreateFromTemplate(templateId: string) {
  try {
    const document = await createDocumentFromTemplate(templateId, {
      author: user.value.name,
    })
    isTemplateDialogOpen.value = false
    await recordDocumentOpen(document.id)
    await loadData()
    router.push(`/documents/${document.id}`)
  } catch {
    ElMessage.error('根据模板创建文档失败。')
  }
}

async function handleDeleteTemplate(templateId: string) {
  try {
    await removeDocumentTemplate(templateId)
    templates.value = templates.value.filter((template) => template.id !== templateId)
    ElMessage.success('模板已删除。')
  } catch {
    ElMessage.error('删除模板失败。')
  }
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('确定退出当前账号吗？', '退出登录', {
      confirmButtonText: '退出',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('退出失败。')
    }
    return
  }

  await logout()
  ElMessage.success('已退出登录。')
  router.replace('/login')
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  min-height: 100vh;
  background: linear-gradient(180deg, #f4f7fb 0%, #eef2f8 100%);
}

.hidden-input {
  display: none;
}

.main-page {
  flex: 1;
  min-width: 0;
  padding: 20px 24px 28px;
}

.template-dialog {
  min-height: 220px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.template-card {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid #dbe4f3;
  background: linear-gradient(180deg, #fff 0%, #f9fbff 100%);
}

.template-title {
  font-size: 16px;
  font-weight: 700;
  color: #101828;
}

.template-desc,
.template-meta,
.template-preview {
  margin-top: 8px;
  color: #667085;
  line-height: 1.7;
}

.template-preview {
  min-height: 68px;
  font-size: 12px;
}

.template-actions {
  margin-top: 14px;
  display: flex;
  gap: 10px;
}
</style>
