<template>
  <div class="wrapper">
    <div class="side-bar">
      <sideBar
        active-tab="knowledgeBases"
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
      <knowledge-main-page
        :knowledge-bases="filteredKnowledgeBases"
        :filter="filter"
        :keyword="keyword"
        :selected-tag="selectedTag"
        :available-tags="availableTags"
        @create="handleCreateKnowledgeBase"
        @open="handleOpenKnowledgeBase"
        @rename="handleRenameKnowledgeBase"
        @duplicate="handleDuplicateKnowledgeBase"
        @delete="handleDeleteKnowledgeBase"
        @update:filter="filter = $event"
        @update:keyword="keyword = $event"
        @update:selected-tag="selectedTag = $event"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import sideBar from '@/pages/homePage/components/sideBar.vue'
import KnowledgeMainPage from './components/KnowledgeMainPage.vue'
import { getCurrentUser, logout } from '@/api/user'
import { getDocumentList, getRecentDocuments, recordDocumentOpen } from '@/api/document'
import {
  createKnowledgeBase,
  duplicateKnowledgeBase,
  getKnowledgeBaseList,
  getRecentKnowledgeBases,
  recordKnowledgeBaseOpen,
  removeKnowledgeBase,
  saveKnowledgeBase,
} from '@/api/knowledgeBase'
import type { DocumentSummary, RecentDocumentItem } from '@/types/document'
import type { KnowledgeBaseSummary, RecentKnowledgeBaseItem } from '@/types/knowledgeBase'
import type { UserProfile } from '@/types/user'

defineOptions({
  name: 'knowledgeHomePage',
})

const router = useRouter()
const documents = ref<DocumentSummary[]>([])
const recentDocuments = ref<RecentDocumentItem[]>([])
const knowledgeBases = ref<KnowledgeBaseSummary[]>([])
const recentKnowledgeBases = ref<RecentKnowledgeBaseItem[]>([])
const user = ref<UserProfile>({
  id: '',
  name: 'Guest',
  color: '#1677ff',
})
const filter = ref('all')
const keyword = ref('')
const selectedTag = ref('')

const availableTags = computed(() =>
  Array.from(
    new Set(
      knowledgeBases.value
        .flatMap((knowledgeBase) => knowledgeBase.tags)
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ).sort((left, right) => left.localeCompare(right)),
)

const filteredKnowledgeBases = computed(() =>
  knowledgeBases.value.filter((knowledgeBase) => {
    const matchFilter = filter.value === 'all' || knowledgeBase.visibility === filter.value
    const normalizedKeyword = keyword.value.trim().toLowerCase()
    const normalizedTag = selectedTag.value.trim().toLowerCase()
    const matchKeyword =
      normalizedKeyword.length === 0 ||
      knowledgeBase.title.toLowerCase().includes(normalizedKeyword) ||
      knowledgeBase.description.toLowerCase().includes(normalizedKeyword) ||
      knowledgeBase.preview.toLowerCase().includes(normalizedKeyword) ||
      knowledgeBase.tags.some((tag) => tag.toLowerCase().includes(normalizedKeyword))
    const matchTag =
      normalizedTag.length === 0 || knowledgeBase.tags.some((tag) => tag.toLowerCase() === normalizedTag)

    return matchFilter && matchKeyword && matchTag
  }),
)

async function loadData() {
  const [
    currentUser,
    currentDocuments,
    currentRecentDocuments,
    currentKnowledgeBases,
    currentRecentKnowledgeBases,
  ] = await Promise.all([
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

async function handleCreateKnowledgeBase() {
  const knowledgeBase = await createKnowledgeBase({
    author: user.value.name,
    title: 'Untitled Knowledge Note',
    description: 'Reusable note for your knowledge base.',
    content: '<h1>Untitled Knowledge Note</h1><p></p>',
    tags: ['note'],
  })

  await recordKnowledgeBaseOpen(knowledgeBase.id)
  await loadData()
  router.push(`/knowledge/${knowledgeBase.id}`)
}

async function handleOpenKnowledgeBase(id: string) {
  await recordKnowledgeBaseOpen(id)
  await loadData()
  router.push(`/knowledge/${id}`)
}

async function handleOpenDocument(id: string) {
  await recordDocumentOpen(id)
  await loadData()
  router.push(`/documents/${id}`)
}

async function handleRenameKnowledgeBase(id: string) {
  const target = knowledgeBases.value.find((knowledgeBase) => knowledgeBase.id === id)
  if (!target) {
    return
  }

  try {
    const { value } = await ElMessageBox.prompt('Enter a new title for this knowledge note.', 'Rename Knowledge Note', {
      inputValue: target.title,
      inputPattern: /\S+/,
      inputErrorMessage: 'Title cannot be empty.',
      confirmButtonText: 'Rename',
    })

    await saveKnowledgeBase(id, { title: value.trim() })
    await loadData()
    ElMessage.success('Knowledge note renamed.')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Rename cancelled due to an unexpected error.')
    }
  }
}

async function handleDuplicateKnowledgeBase(id: string) {
  const target = knowledgeBases.value.find((knowledgeBase) => knowledgeBase.id === id)
  if (!target) {
    return
  }

  try {
    const duplicated = await duplicateKnowledgeBase(id, {
      title: `${target.title} Copy`,
      description: target.description,
      tags: target.tags,
      relatedDocumentIds: target.relatedDocumentIds,
      relatedKnowledgeBaseIds: target.relatedKnowledgeBaseIds,
    })

    await recordKnowledgeBaseOpen(duplicated.id)
    await loadData()
    ElMessage.success('Knowledge note duplicated.')
    router.push(`/knowledge/${duplicated.id}`)
  } catch {
    ElMessage.error('Unable to duplicate the knowledge note.')
  }
}

async function handleDeleteKnowledgeBase(id: string) {
  const target = knowledgeBases.value.find((knowledgeBase) => knowledgeBase.id === id)
  if (!target) {
    return
  }

  try {
    await ElMessageBox.confirm(`Delete "${target.title}"? This action cannot be undone.`, 'Delete Knowledge Note', {
      type: 'warning',
      confirmButtonText: 'Delete',
      cancelButtonText: 'Cancel',
    })

    await removeKnowledgeBase(id)
    await loadData()
    ElMessage.success('Knowledge note deleted.')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('Unable to delete the knowledge note.')
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
