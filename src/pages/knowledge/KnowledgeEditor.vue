<template>
  <div class="editor-page">
    <div>
      <editor-header
        :editor="editorInstance"
        :title="title"
        :is-saving="isSaving"
        :last-saved-at="lastSavedAt"
        :is-collaborative="isCollaborative"
        :is-dirty="isDirty"
        :save-error="saveError"
        :visibility="visibility"
        :word-count="wordCount"
        :character-count="characterCount"
        :search-query="searchQuery"
        :search-match-count="searchMatches.length"
        :active-search-index="activeSearchIndex"
        @update:title="handleTitleChange"
        @update:visibility="handleVisibilityChange"
        @update:search="handleSearchChange"
        @search-prev="focusPreviousSearchMatch"
        @search-next="focusNextSearchMatch"
        @toggle-settings="isSettingsOpen = true"
        @save="saveCurrentKnowledgeBase(true)"
        @back="router.push('/knowledge')"
      />
    </div>
    <div class="wrapper">
      <div class="toc-container">
        <table-of-contents :editor="editorInstance" class="toc" v-if="editorInstance" />
      </div>
      <div class="editor-container">
        <div v-if="isCollaborationAvailable" class="collab-banner">
          Collaboration server configured. Current mode: {{ isCollaborative ? 'enabled' : 'disconnected' }}.
        </div>
        <div v-else class="collab-banner muted">
          Collaboration is kept as an MVP placeholder. Set `VITE_COLLAB_WS_URL` to wire a real server.
        </div>
        <rich-text-editor
          :editor="editorInstance"
          :can-collaborate="isCollaborationAvailable"
          :is-collaborative="isCollaborative"
          v-if="editorInstance"
          @toggle-collaboration="toggleCollaboration"
        />
      </div>
    </div>

    <el-drawer v-model="isSettingsOpen" title="Knowledge Note Settings" size="420px">
      <div class="settings-panel">
        <el-form label-position="top">
          <el-form-item label="Title">
            <el-input :model-value="title" @input="handleTitleChange" />
          </el-form-item>
          <el-form-item label="Description">
            <el-input type="textarea" :rows="4" :model-value="description" @input="handleDescriptionChange" />
          </el-form-item>
          <el-form-item label="Tags">
            <el-input :model-value="tagsInput" @input="handleTagsInput" placeholder="crdt, editor, reference" />
          </el-form-item>
          <el-form-item label="Related Documents">
            <el-select
              class="settings-field"
              multiple
              filterable
              collapse-tags
              collapse-tags-tooltip
              :model-value="relatedDocumentIds"
              @update:model-value="handleRelatedDocumentsChange"
            >
              <el-option v-for="document in documentOptions" :key="document.id" :label="document.title" :value="document.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="Related Knowledge Notes">
            <el-select
              class="settings-field"
              multiple
              filterable
              collapse-tags
              collapse-tags-tooltip
              :model-value="relatedKnowledgeBaseIds"
              @update:model-value="handleRelatedKnowledgeBasesChange"
            >
              <el-option
                v-for="knowledgeBase in relatedKnowledgeOptions"
                :key="knowledgeBase.id"
                :label="knowledgeBase.title"
                :value="knowledgeBase.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="Visibility">
            <el-select class="settings-field" :model-value="visibility" @update:model-value="handleVisibilityChange">
              <el-option label="Private" value="private" />
              <el-option label="Shared" value="shared" />
            </el-select>
          </el-form-item>
          <el-form-item label="Knowledge Note ID">
            <el-input :model-value="knowledgeBaseId" readonly />
          </el-form-item>
          <el-form-item label="Room">
            <el-input :model-value="roomName" readonly />
          </el-form-item>
          <el-form-item label="Last saved">
            <el-input :model-value="lastSavedAt ? new Date(lastSavedAt).toLocaleString() : 'Not saved yet'" readonly />
          </el-form-item>
        </el-form>

        <div class="settings-card">
          <div class="settings-card-title">Knowledge Graph</div>
          <div class="settings-stat">Document links: {{ relatedDocumentIds.length }}</div>
          <div class="settings-stat">Knowledge links: {{ relatedKnowledgeBaseIds.length }}</div>
          <div class="settings-stat">Tags: {{ tags.length }}</div>
        </div>

        <div class="settings-card">
          <div class="settings-card-title">Statistics</div>
          <div class="settings-stat">Words: {{ wordCount }}</div>
          <div class="settings-stat">Characters: {{ characterCount }}</div>
          <div class="settings-stat">Search matches: {{ searchMatches.length }}</div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script lang="ts" setup>
import * as Y from 'yjs'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useEditor } from '@tiptap/vue-3'
import type { Editor as CoreEditor } from '@tiptap/core'
import RichTextEditor from '@/pages/editor/components/RichTextEditor.vue'
import TableOfContents from '@/pages/editor/components/TableOfContents.vue'
import EditorHeader from '@/pages/editor/components/EditorHeader.vue'
import { getDocumentList } from '@/api/document'
import { getKnowledgeBaseDetail, getKnowledgeBaseList, recordKnowledgeBaseOpen, saveKnowledgeBase } from '@/api/knowledgeBase'
import type { DocumentVisibility, DocumentSummary } from '@/types/document'
import type { KnowledgeBaseSummary } from '@/types/knowledgeBase'
import { createEditorExtensions } from '@/utils/editorExtensions'
import { arraysEqual, normalizeVisibility, readStringArray, setMetaValueIfChanged } from '@/utils/collaborationMeta'
import { getStoredToken, getStoredUser } from '@/utils/localStore'
import { useCollaborationProvider } from '@/utils/useCollaborationProvider'
import '@/styles/editor.scss'

type SearchMatch = {
  from: number
  to: number
}

const route = useRoute()
const router = useRouter()
const knowledgeBaseId = route.params.id as string
const collabUrl = import.meta.env.VITE_COLLAB_WS_URL as string | undefined
const roomName = `knowledge:${knowledgeBaseId}`
const storedUser = getStoredUser()
const storedToken = getStoredToken() || undefined

const sharedDoc = collabUrl ? new Y.Doc() : null
const metaMap = sharedDoc?.getMap<unknown>('meta') ?? null
const collaboration = collabUrl && sharedDoc
  ? useCollaborationProvider({
      wsUrl: collabUrl,
      roomName,
      doc: sharedDoc,
      token: storedToken,
      user: {
        name: storedUser.name,
        color: storedUser.color,
      },
      autoConnect: true,
    })
  : null

const title = ref('Untitled Knowledge Note')
const description = ref('Reusable note for your local knowledge base.')
const tags = ref<string[]>([])
const relatedDocumentIds = ref<string[]>([])
const relatedKnowledgeBaseIds = ref<string[]>([])
const documentOptions = ref<DocumentSummary[]>([])
const knowledgeBaseOptions = ref<KnowledgeBaseSummary[]>([])
const visibility = ref<DocumentVisibility>('private')
const isSaving = ref(false)
const isDirty = ref(false)
const lastSavedAt = ref('')
const saveError = ref('')
const isHydrating = ref(false)
const isCollaborative = ref(false)
const isCollaborationAvailable = Boolean(collaboration)
const hasReceivedInitialSync = ref(!isCollaborationAvailable)
const hasSeededCollaborationState = ref(false)
const queuedSave = ref(false)
const wordCount = ref(0)
const characterCount = ref(0)
const isSettingsOpen = ref(false)
const searchQuery = ref('')
const searchMatches = ref<SearchMatch[]>([])
const activeSearchIndex = ref(-1)
const latestContentSnapshot = ref('<p></p>')
let autoSaveTimer: number | null = null
let suppressMetaObserver = false

const tagsInput = computed(() => tags.value.join(', '))
const relatedKnowledgeOptions = computed(() => knowledgeBaseOptions.value.filter((item) => item.id !== knowledgeBaseId))

const editor = useEditor({
  extensions: createEditorExtensions({
    ydoc: sharedDoc ?? undefined,
    collaborationProvider: collaboration?.provider,
    collaborationUser: collaboration?.user,
  }),
  content: isCollaborationAvailable ? undefined : '<p></p>',
  onUpdate: ({ editor: currentEditor }) => {
    if (isHydrating.value) {
      return
    }

    latestContentSnapshot.value = currentEditor.getHTML()
    syncEditorStats(currentEditor)
    refreshSearchMatches(currentEditor, true)
    markDirty()
  },
  onCreate: ({ editor: currentEditor }) => {
    latestContentSnapshot.value = currentEditor.getHTML()
    syncEditorStats(currentEditor)
  },
})

const editorInstance = computed(() => editor.value ?? null)

function syncEditorStats(currentEditor: CoreEditor | null = editor.value ?? null) {
  if (!currentEditor) {
    wordCount.value = 0
    characterCount.value = 0
    return
  }

  wordCount.value = currentEditor.storage.characterCount.words()
  characterCount.value = currentEditor.storage.characterCount.characters()
}

function refreshSearchMatches(currentEditor: CoreEditor | null = editor.value ?? null, preserveIndex = false) {
  const normalizedQuery = searchQuery.value.trim().toLowerCase()
  if (!currentEditor || normalizedQuery.length === 0) {
    searchMatches.value = []
    activeSearchIndex.value = -1
    return
  }

  const matches: SearchMatch[] = []

  currentEditor.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) {
      return
    }

    const text = node.text.toLowerCase()
    let searchStart = 0

    while (true) {
      const foundIndex = text.indexOf(normalizedQuery, searchStart)
      if (foundIndex === -1) {
        break
      }

      const from = pos + foundIndex
      matches.push({
        from,
        to: from + normalizedQuery.length,
      })
      searchStart = foundIndex + normalizedQuery.length
    }
  })

  searchMatches.value = matches

  if (matches.length === 0) {
    activeSearchIndex.value = -1
    return
  }

  if (preserveIndex && activeSearchIndex.value >= 0 && activeSearchIndex.value < matches.length) {
    return
  }

  activeSearchIndex.value = 0
}

function focusSearchMatch(index: number) {
  const currentEditor = editor.value
  const match = searchMatches.value[index]
  if (!currentEditor || !match) {
    return
  }

  activeSearchIndex.value = index
  currentEditor.chain().focus().setTextSelection({ from: match.from, to: match.to }).run()
}

function focusNextSearchMatch() {
  if (searchMatches.value.length === 0) {
    return
  }

  const nextIndex = activeSearchIndex.value < searchMatches.value.length - 1 ? activeSearchIndex.value + 1 : 0
  focusSearchMatch(nextIndex)
}

function focusPreviousSearchMatch() {
  if (searchMatches.value.length === 0) {
    return
  }

  const previousIndex = activeSearchIndex.value > 0 ? activeSearchIndex.value - 1 : searchMatches.value.length - 1
  focusSearchMatch(previousIndex)
}

function handleSearchChange(value: string) {
  searchQuery.value = value
  refreshSearchMatches()

  if (searchMatches.value.length > 0) {
    focusSearchMatch(0)
  }
}

function readMetaIntoState() {
  if (!metaMap) {
    return
  }

  const nextTitle = metaMap.get('title')
  const nextDescription = metaMap.get('description')
  const nextVisibility = metaMap.get('visibility')
  const nextTags = readStringArray(metaMap.get('tags'))
  const nextRelatedDocumentIds = readStringArray(metaMap.get('relatedDocumentIds'))
  const nextRelatedKnowledgeBaseIds = readStringArray(metaMap.get('relatedKnowledgeBaseIds')).filter((id) => id !== knowledgeBaseId)

  if (typeof nextTitle === 'string' && nextTitle.trim()) {
    title.value = nextTitle
  }

  if (typeof nextDescription === 'string') {
    description.value = nextDescription
  }

  if (metaMap.has('tags')) {
    tags.value = nextTags
  }

  if (metaMap.has('relatedDocumentIds')) {
    relatedDocumentIds.value = nextRelatedDocumentIds
  }

  if (metaMap.has('relatedKnowledgeBaseIds')) {
    relatedKnowledgeBaseIds.value = nextRelatedKnowledgeBaseIds
  }

  if (metaMap.has('visibility')) {
    visibility.value = normalizeVisibility(nextVisibility)
  }
}

function syncStateIntoMeta() {
  if (!metaMap) {
    return
  }

  setMetaValueIfChanged(metaMap, 'title', title.value)
  setMetaValueIfChanged(metaMap, 'description', description.value)
  setMetaValueIfChanged(metaMap, 'tags', tags.value)
  setMetaValueIfChanged(metaMap, 'relatedDocumentIds', relatedDocumentIds.value)
  setMetaValueIfChanged(metaMap, 'relatedKnowledgeBaseIds', relatedKnowledgeBaseIds.value)
  setMetaValueIfChanged(metaMap, 'visibility', visibility.value)
}

function sharedDocumentHasContent() {
  if (!sharedDoc) {
    return false
  }

  return sharedDoc.getXmlFragment('content').length > 0
}

function sharedMetaHasValues() {
  if (!metaMap) {
    return false
  }

  return metaMap.size > 0
}

function applyMetaObserver() {
  readMetaIntoState()

  if (!suppressMetaObserver && !isHydrating.value && hasSeededCollaborationState.value) {
    markDirty()
  }
}

async function seedSharedDocumentFromSnapshot() {
  if (!isCollaborationAvailable || !hasReceivedInitialSync.value || hasSeededCollaborationState.value) {
    return
  }

  if (!editor.value) {
    return
  }

  suppressMetaObserver = true

  if (sharedMetaHasValues()) {
    readMetaIntoState()
  } else {
    syncStateIntoMeta()
  }

  if (sharedDocumentHasContent()) {
    latestContentSnapshot.value = editor.value.getHTML()
    syncEditorStats()
    refreshSearchMatches()
    isDirty.value = false
  } else if (latestContentSnapshot.value.trim()) {
    isHydrating.value = true
    editor.value.commands.setContent(latestContentSnapshot.value, false)
    await new Promise((resolve) => window.setTimeout(resolve, 0))
    isHydrating.value = false
    isDirty.value = false
    syncEditorStats()
    refreshSearchMatches()
  }

  suppressMetaObserver = false
  hasSeededCollaborationState.value = true
}

async function loadReferenceOptions() {
  const [documents, knowledgeBases] = await Promise.all([getDocumentList(), getKnowledgeBaseList()])
  documentOptions.value = documents
  knowledgeBaseOptions.value = knowledgeBases
}

async function hydrateKnowledgeBase() {
  const knowledgeBase = await getKnowledgeBaseDetail(knowledgeBaseId)

  if (!knowledgeBase) {
    router.replace('/notFound')
    return
  }

  title.value = knowledgeBase.title
  description.value = knowledgeBase.description
  tags.value = knowledgeBase.tags
  relatedDocumentIds.value = knowledgeBase.relatedDocumentIds
  relatedKnowledgeBaseIds.value = knowledgeBase.relatedKnowledgeBaseIds.filter((id) => id !== knowledgeBaseId)
  visibility.value = knowledgeBase.visibility
  lastSavedAt.value = knowledgeBase.lastModifiedAt
  latestContentSnapshot.value = knowledgeBase.content || '<p></p>'
  saveError.value = ''

  if (editor.value && !isCollaborationAvailable) {
    isHydrating.value = true
    editor.value.commands.setContent(knowledgeBase.content, false)
    window.setTimeout(() => {
      isHydrating.value = false
      isDirty.value = false
      syncEditorStats()
      refreshSearchMatches()
    }, 0)
    return
  }

  await seedSharedDocumentFromSnapshot()
}

function clearAutoSaveTimer() {
  if (autoSaveTimer) {
    window.clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }
}

function scheduleAutoSave() {
  clearAutoSaveTimer()
  autoSaveTimer = window.setTimeout(() => {
    void saveCurrentKnowledgeBase()
  }, 1000)
}

function markDirty() {
  isDirty.value = true
  saveError.value = ''

  if (isSaving.value) {
    queuedSave.value = true
    return
  }

  scheduleAutoSave()
}

async function saveCurrentKnowledgeBase(force = false) {
  if (!editor.value) {
    return
  }

  if (isHydrating.value) {
    return
  }

  if (isSaving.value) {
    queuedSave.value = true
    return
  }

  if (!force && !isDirty.value) {
    return
  }

  clearAutoSaveTimer()
  isSaving.value = true
  saveError.value = ''

  try {
    const knowledgeBase = await saveKnowledgeBase(knowledgeBaseId, {
      title: title.value,
      description: description.value,
      tags: tags.value,
      relatedDocumentIds: relatedDocumentIds.value,
      relatedKnowledgeBaseIds: relatedKnowledgeBaseIds.value,
      content: editor.value.getHTML(),
      visibility: visibility.value,
    })

    title.value = knowledgeBase.title
    description.value = knowledgeBase.description
    tags.value = knowledgeBase.tags
    relatedDocumentIds.value = knowledgeBase.relatedDocumentIds
    relatedKnowledgeBaseIds.value = knowledgeBase.relatedKnowledgeBaseIds.filter((id) => id !== knowledgeBaseId)
    visibility.value = knowledgeBase.visibility
    lastSavedAt.value = knowledgeBase.lastModifiedAt
    latestContentSnapshot.value = knowledgeBase.content
    isDirty.value = false
  } catch {
    saveError.value = 'Save failed. Changes are kept locally until retry.'
    isDirty.value = true
  } finally {
    isSaving.value = false

    if (queuedSave.value) {
      queuedSave.value = false

      if (isDirty.value) {
        scheduleAutoSave()
      }
    }
  }
}

function handleTitleChange(value: string) {
  title.value = value

  if (metaMap && hasReceivedInitialSync.value) {
    setMetaValueIfChanged(metaMap, 'title', value)
  }

  markDirty()
}

function handleDescriptionChange(value: string) {
  description.value = value

  if (metaMap && hasReceivedInitialSync.value) {
    setMetaValueIfChanged(metaMap, 'description', value)
  }

  markDirty()
}

function handleTagsInput(value: string) {
  const nextTags = value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12)

  if (arraysEqual(tags.value, nextTags)) {
    return
  }

  tags.value = nextTags

  if (metaMap && hasReceivedInitialSync.value) {
    setMetaValueIfChanged(metaMap, 'tags', nextTags)
  }

  markDirty()
}

function handleRelatedDocumentsChange(value: string[]) {
  const nextValue = value.filter(Boolean)
  relatedDocumentIds.value = nextValue

  if (metaMap && hasReceivedInitialSync.value) {
    setMetaValueIfChanged(metaMap, 'relatedDocumentIds', nextValue)
  }

  markDirty()
}

function handleRelatedKnowledgeBasesChange(value: string[]) {
  const nextValue = value.filter((id) => id && id !== knowledgeBaseId)
  relatedKnowledgeBaseIds.value = nextValue

  if (metaMap && hasReceivedInitialSync.value) {
    setMetaValueIfChanged(metaMap, 'relatedKnowledgeBaseIds', nextValue)
  }

  markDirty()
}

function handleVisibilityChange(value: DocumentVisibility) {
  visibility.value = value

  if (metaMap && hasReceivedInitialSync.value) {
    setMetaValueIfChanged(metaMap, 'visibility', value)
  }

  markDirty()
}

function toggleCollaboration() {
  if (!collaboration) {
    return
  }

  if (isCollaborative.value) {
    collaboration.disconnect()
    isCollaborative.value = false
    return
  }

  collaboration.connect()
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!isDirty.value) {
    return
  }

  event.preventDefault()
  event.returnValue = ''
}

function handleCollaborationStatus(event: { status: 'connected' | 'disconnected' | 'connecting' }) {
  isCollaborative.value = event.status === 'connected'
}

function handleCollaborationSync(isSynced: boolean) {
  hasReceivedInitialSync.value = isSynced
  if (isSynced) {
    void seedSharedDocumentFromSnapshot()
  }
}

onBeforeRouteLeave(() => {
  if (!isDirty.value) {
    return true
  }

  return window.confirm('You have unsaved changes. Leave this page anyway?')
})

onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload)

  if (collaboration) {
    collaboration.provider.on('status', handleCollaborationStatus)
    collaboration.provider.on('sync', handleCollaborationSync)
  }

  metaMap?.observe(applyMetaObserver)

  await Promise.all([recordKnowledgeBaseOpen(knowledgeBaseId), loadReferenceOptions()])
  await hydrateKnowledgeBase()
})

onBeforeUnmount(() => {
  clearAutoSaveTimer()
  window.removeEventListener('beforeunload', handleBeforeUnload)

  metaMap?.unobserve(applyMetaObserver)

  if (collaboration) {
    collaboration.provider.off('status', handleCollaborationStatus)
    collaboration.provider.off('sync', handleCollaborationSync)
    collaboration.destroy()
  }

  sharedDoc?.destroy()
})
</script>

<style lang="scss" scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-field {
  width: 100%;
}

.settings-card {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f8fafc;
}

.settings-card-title {
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #667085;
  text-transform: uppercase;
}

.settings-stat + .settings-stat {
  margin-top: 8px;
}
</style>
