<template>
  <div class="wrapper">
    <div class="side-bar">
      <sideBar :user-name="user.name" :document-count="documents.length" />
    </div>
    <div class="main-page">
      <mainPage
        :documents="filteredDocuments"
        :filter="filter"
        :keyword="keyword"
        @create="handleCreateDocument"
        @open="handleOpenDocument"
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
import sideBar from './components/sideBar.vue'
import mainPage from './components/mainPage.vue'
import { createDocument, getDocumentList, removeDocument } from '@/api/document'
import { getCurrentUser } from '@/api/user'
import type { DocumentSummary } from '@/types/document'
import type { UserProfile } from '@/types/user'

defineOptions({
  name: 'homePage',
})

const router = useRouter()
const documents = ref<DocumentSummary[]>([])
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
  const [currentUser, currentDocuments] = await Promise.all([getCurrentUser(), getDocumentList()])
  user.value = currentUser
  documents.value = currentDocuments
}

async function handleCreateDocument() {
  const document = await createDocument({
    author: user.value.name,
    title: 'Untitled Document',
    content: '<h1>Untitled Document</h1><p></p>',
  })

  await loadData()
  router.push(`/documents/${document.id}`)
}

function handleOpenDocument(id: string) {
  router.push(`/documents/${id}`)
}

async function handleDeleteDocument(id: string) {
  await removeDocument(id)
  await loadData()
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
