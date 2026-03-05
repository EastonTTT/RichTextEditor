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
  name: '访客',
  color: '#1677ff',
})
const filter = ref('all')
const keyword = ref('')
const selectedTag = ref('')

function normalizeSearchText(value: string | undefined | null) {
  return `${value || ''}`
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

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

const documentMap = computed(() =>
  new Map(documents.value.map((document) => [document.id, document])),
)

const filteredKnowledgeBases = computed(() =>
  knowledgeBases.value.filter((knowledgeBase) => {
    const matchFilter = filter.value === 'all' || knowledgeBase.visibility === filter.value
    const normalizedKeyword = normalizeSearchText(keyword.value)
    const normalizedTag = normalizeSearchText(selectedTag.value)
    const relatedContent = knowledgeBase.relatedDocumentIds
      .map((documentId) => documentMap.value.get(documentId))
      .filter((document): document is DocumentSummary => Boolean(document))
      .map((document) => `${document.title} ${document.preview} ${document.ownerName} ${document.content || ''}`)
      .join(' ')
    const searchableTitle = normalizeSearchText(knowledgeBase.title)
    const searchableDescription = normalizeSearchText(knowledgeBase.description)
    const searchableOwner = normalizeSearchText(knowledgeBase.ownerName)
    const searchableContent = normalizeSearchText(knowledgeBase.content)
    const searchableTags = knowledgeBase.tags.map((tag) => normalizeSearchText(tag))
    const searchableRelatedContent = normalizeSearchText(relatedContent)
    const matchKeyword =
      normalizedKeyword.length === 0 ||
      searchableTitle.includes(normalizedKeyword) ||
      searchableDescription.includes(normalizedKeyword) ||
      searchableTags.some((tag) => tag.includes(normalizedKeyword)) ||
      searchableOwner.includes(normalizedKeyword) ||
      searchableContent.includes(normalizedKeyword) ||
      searchableRelatedContent.includes(normalizedKeyword)
    const matchTag =
      normalizedTag.length === 0 || searchableTags.some((tag) => tag === normalizedTag)

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
    title: '未命名知识库',
    description: '用于归档同一主题下的多篇文档。',
    tags: ['专题'],
    relatedDocumentIds: [],
    relatedKnowledgeBaseIds: [],
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
    const { value } = await ElMessageBox.prompt('请输入新的知识库名称。', '重命名知识库', {
      inputValue: target.title,
      inputPattern: /\S+/,
      inputErrorMessage: '标题不能为空。',
      confirmButtonText: '保存',
    })

    await saveKnowledgeBase(id, { title: value.trim(), relatedKnowledgeBaseIds: [] })
    await loadData()
    ElMessage.success('知识库已重命名。')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('重命名失败。')
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
      title: `${target.title} 副本`,
      description: target.description,
      tags: target.tags,
      relatedDocumentIds: target.relatedDocumentIds,
      relatedKnowledgeBaseIds: [],
    })

    await recordKnowledgeBaseOpen(duplicated.id)
    await loadData()
    ElMessage.success('知识库已复制。')
    router.push(`/knowledge/${duplicated.id}`)
  } catch {
    ElMessage.error('复制知识库失败。')
  }
}

async function handleDeleteKnowledgeBase(id: string) {
  const target = knowledgeBases.value.find((knowledgeBase) => knowledgeBase.id === id)
  if (!target) {
    return
  }

  try {
    await ElMessageBox.confirm(`确认删除“${target.title}”？该操作不可恢复。`, '删除知识库', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })

    await removeKnowledgeBase(id)
    await loadData()
    ElMessage.success('知识库已删除。')
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除知识库失败。')
    }
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

.main-page {
  flex: 1;
  min-width: 0;
  padding: 20px 24px 28px;
}
</style>
