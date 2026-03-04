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
        @save="saveCurrentDocument(true)"
        @back="router.push('/home')"
      />
    </div>
    <div class="wrapper">
      <div class="toc-container">
        <table-of-contents :editor="editorInstance" class="toc" v-if="editorInstance" />
      </div>
      <div class="editor-container">
        <div v-if="isCollaborationAvailable" class="collab-banner">
          Collaboration server configured. Current mode: {{ isCollaborative ? 'enabled' : 'disabled' }}.
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

    <el-drawer v-model="isSettingsOpen" title="Document Settings" size="360px">
      <div class="settings-panel">
        <el-form label-position="top">
          <el-form-item label="Title">
            <el-input :model-value="title" @input="handleTitleChange" />
          </el-form-item>
          <el-form-item label="Visibility">
            <el-select class="settings-field" :model-value="visibility" @update:model-value="handleVisibilityChange">
              <el-option label="Private" value="private" />
              <el-option label="Shared" value="shared" />
            </el-select>
          </el-form-item>
          <el-form-item label="Document ID">
            <el-input :model-value="documentId" readonly />
          </el-form-item>
          <el-form-item label="Last saved">
            <el-input :model-value="lastSavedAt ? new Date(lastSavedAt).toLocaleString() : 'Not saved yet'" readonly />
          </el-form-item>
        </el-form>

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
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { useEditor } from '@tiptap/vue-3'
import type { Editor as CoreEditor } from '@tiptap/core'
import RichTextEditor from '@/pages/editor/components/RichTextEditor.vue'
import TableOfContents from '@/pages/editor/components/TableOfContents.vue'
import EditorHeader from './components/EditorHeader.vue'
import { basicExtensions } from '@/utils/editorExtensions'
import '@/styles/editor.scss'
import { getDocumentDetail, recordDocumentOpen, saveDocument } from '@/api/document'
import type { DocumentVisibility } from '@/types/document'

type SearchMatch = {
  from: number
  to: number
}

const route = useRoute()
const router = useRouter()
const documentId = route.params.id as string
const collabUrl = import.meta.env.VITE_COLLAB_WS_URL as string | undefined

const title = ref('Untitled Document')
const visibility = ref<DocumentVisibility>('private')
const isSaving = ref(false)
const isDirty = ref(false)
const lastSavedAt = ref('')
const saveError = ref('')
const isHydrating = ref(false)
const isCollaborative = ref(false)
const isCollaborationAvailable = Boolean(collabUrl)
const queuedSave = ref(false)
const wordCount = ref(0)
const characterCount = ref(0)
const isSettingsOpen = ref(false)
const searchQuery = ref('')
const searchMatches = ref<SearchMatch[]>([])
const activeSearchIndex = ref(-1)
let autoSaveTimer: number | null = null

const editor = useEditor({
  extensions: basicExtensions,
  content: '<p></p>',
  onUpdate: ({ editor: currentEditor }) => {
    if (isHydrating.value) {
      return
    }

    syncEditorStats(currentEditor)
    refreshSearchMatches(currentEditor, true)
    markDirty()
  },
  onCreate: ({ editor: currentEditor }) => {
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

async function hydrateDocument() {
  const document = await getDocumentDetail(documentId)

  if (!document) {
    router.replace('/notFound')
    return
  }

  title.value = document.title
  visibility.value = document.visibility
  lastSavedAt.value = document.lastModifiedAt
  saveError.value = ''

  if (editor.value) {
    isHydrating.value = true
    editor.value.commands.setContent(document.content, false)
    window.setTimeout(() => {
      isHydrating.value = false
      isDirty.value = false
      syncEditorStats()
      refreshSearchMatches()
    }, 0)
  }
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
    void saveCurrentDocument()
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

async function saveCurrentDocument(force = false) {
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
    const document = await saveDocument(documentId, {
      title: title.value,
      content: editor.value.getHTML(),
      visibility: visibility.value,
    })

    title.value = document.title
    visibility.value = document.visibility
    lastSavedAt.value = document.lastModifiedAt
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
  markDirty()
}

function handleVisibilityChange(value: DocumentVisibility) {
  visibility.value = value
  markDirty()
}

function toggleCollaboration() {
  if (!isCollaborationAvailable) {
    return
  }

  isCollaborative.value = !isCollaborative.value
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!isDirty.value) {
    return
  }

  event.preventDefault()
  event.returnValue = ''
}

onBeforeRouteLeave(() => {
  if (!isDirty.value) {
    return true
  }

  return window.confirm('You have unsaved changes. Leave this page anyway?')
})

onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  await recordDocumentOpen(documentId)
  await hydrateDocument()
})

onBeforeUnmount(() => {
  clearAutoSaveTimer()
  window.removeEventListener('beforeunload', handleBeforeUnload)
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
