<template>
  <div class="wrapper">
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
        :filter="filter"
        :keyword="keyword"
        @create="handleCreateDocument"
        @open="handleOpenDocument"
        @rename="handleRenameDocument"
        @duplicate="handleDuplicateDocument"
        @delete="handleDeleteDocument"
        @update:filter="filter = $event"
        @update:keyword="keyword = $event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import sideBar from './components/sideBar.vue'
import mainPage from './components/mainPage.vue'
import {
  createDocument,
  duplicateDocument,
  getDocumentList,
  getRecentDocuments,
  recordDocumentOpen,
  removeDocument,
  saveDocument,
} from '@/api/document'
import { getKnowledgeBaseList, getRecentKnowledgeBases } from '@/api/knowledgeBase'
import { getCurrentUser, logout } from '@/api/user'
import type { DocumentSummary, RecentDocumentItem } from '@/types/document'
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
const user = ref<UserProfile>({
  id: '',
  name: 'Guest',
  color: '#1677ff',
})
const filter = ref('all')
const keyword = ref('')

const filteredDocuments = computed(() =>
  documents.value.filter((document) => {
    const matchFilter = filter.value === 'all' || document.visibility === filter.value
    const normalizedKeyword = keyword.value.trim().toLowerCase()
    const matchKeyword =
      normalizedKeyword.length === 0 ||
      document.title.toLowerCase().includes(normalizedKeyword) ||
      document.preview.toLowerCase().includes(normalizedKeyword)

    return matchFilter && matchKeyword
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
    title: 'Untitled Document',
    content: '<h1>Untitled Document</h1><p></p>',
  })

  await recordDocumentOpen(document.id)
  await loadData()
  router.push(`/documents/${document.id}`)
}

async function handleOpenDocument(id: string) {
  await recordDocumentOpen(id)
  await loadData()
  router.push(`/documents/${id}`)
}

async function handleOpenKnowledgeBase(id: string) {
  router.push(`/knowledge/${id}`)
}

async function handleRenameDocument(id: string) {
  const target = documents.value.find((document) => document.id === id)
  if (!target) {
    return
  }

  try {
    const { value } = await ElMessageBox.prompt('Enter a new title for this document.', 'Rename Document', {
      inputValue: target.title,
      inputPattern: /\S+/,
      inputErrorMessage: 'Title cannot be empty.',
      confirmButtonText: 'Rename',
    })

    await saveDocument(id, { title: value.trim() })
    await loadData()
    ElMessage.success('Document renamed.')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Rename cancelled due to an unexpected error.')
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
      title: `${target.title} Copy`,
    })

    await recordDocumentOpen(duplicated.id)
    await loadData()
    ElMessage.success('Document duplicated.')
    router.push(`/documents/${duplicated.id}`)
  } catch {
    ElMessage.error('Unable to duplicate the document.')
  }
}

async function handleDeleteDocument(id: string) {
  const target = documents.value.find((document) => document.id === id)
  if (!target) {
    return
  }

  try {
    await ElMessageBox.confirm(`Delete "${target.title}"? This action cannot be undone.`, 'Delete Document', {
      type: 'warning',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    })

    await removeDocument(id)
    await loadData()
    ElMessage.success('Document deleted.')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Unable to delete the document.')
    }
  }
}

async function handleLogout() {
  try {
    await ElMessageBox.confirm('Log out of the current local session?', 'Log Out', {
      confirmButtonText: 'Log out',
      cancelButtonText: 'Cancel',
      type: 'warning',
    })
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Unable to complete logout.')
    }
    return
  }

  await logout()
  ElMessage.success('Logged out.')
  router.replace('/login')
}

onMounted(loadData)
</script>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  min-height: 100vh;

  .main-page {
    padding: 10px;
    flex: 1;
  }
}
</style>
