<template>
  <div>
    <editor-header
      :editor="editor"
      :title="title"
      :is-saving="isSaving"
      :last-saved-at="lastSavedAt"
      :is-collaborative="isCollaborative"
      @update:title="handleTitleChange"
      @save="saveCurrentDocument"
      @back="router.push('/home')"
    />
  </div>
  <div class="wrapper">
    <div class="toc-container">
      <table-of-contents :editor="editor" class="toc" v-if="editor" />
    </div>
    <div class="editor-container">
      <div v-if="isCollaborationAvailable" class="collab-banner">
        Collaboration server configured. Current mode: {{ isCollaborative ? 'enabled' : 'disabled' }}.
      </div>
      <div v-else class="collab-banner muted">
        Collaboration is kept as an MVP placeholder. Set `VITE_COLLAB_WS_URL` to wire a real server.
      </div>
      <rich-text-editor
        :editor="editor"
        :can-collaborate="isCollaborationAvailable"
        :is-collaborative="isCollaborative"
        v-if="editor"
        @toggle-collaboration="toggleCollaboration"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useEditor } from '@tiptap/vue-3'
import RichTextEditor from '@/pages/editor/components/RichTextEditor.vue'
import TableOfContents from '@/pages/editor/components/TableOfContents.vue'
import EditorHeader from './components/EditorHeader.vue'
import { basicExtensions } from '@/utils/editorExtensions'
import '@/styles/editor.scss'
import { getDocumentDetail, saveDocument } from '@/api/document'

const route = useRoute()
const router = useRouter()
const documentId = route.params.id as string
const collabUrl = import.meta.env.VITE_COLLAB_WS_URL as string | undefined

const title = ref('Untitled Document')
const isSaving = ref(false)
const lastSavedAt = ref('')
const isHydrating = ref(false)
const isCollaborative = ref(false)
const isCollaborationAvailable = Boolean(collabUrl)
let autoSaveTimer: number | null = null

const editor = useEditor({
  extensions: basicExtensions,
  content: '<p></p>',
  onUpdate: () => {
    if (isHydrating.value) {
      return
    }

    scheduleAutoSave()
  },
})

async function hydrateDocument() {
  const document = await getDocumentDetail(documentId)

  if (!document) {
    router.replace('/notFound')
    return
  }

  title.value = document.title
  lastSavedAt.value = document.lastModifiedAt

  if (editor.value) {
    isHydrating.value = true
    editor.value.commands.setContent(document.content, false)
    window.setTimeout(() => {
      isHydrating.value = false
    }, 0)
  }
}

function scheduleAutoSave() {
  if (autoSaveTimer) {
    window.clearTimeout(autoSaveTimer)
  }

  autoSaveTimer = window.setTimeout(() => {
    void saveCurrentDocument()
  }, 1000)
}

async function saveCurrentDocument() {
  if (!editor.value) {
    return
  }

  isSaving.value = true

  try {
    const document = await saveDocument(documentId, {
      title: title.value,
      content: editor.value.getHTML(),
    })

    title.value = document.title
    lastSavedAt.value = document.lastModifiedAt
  } finally {
    isSaving.value = false
  }
}

function handleTitleChange(value: string) {
  title.value = value
  scheduleAutoSave()
}

function toggleCollaboration() {
  if (!isCollaborationAvailable) {
    return
  }

  isCollaborative.value = !isCollaborative.value
}

onMounted(async () => {
  await hydrateDocument()
})

onBeforeUnmount(() => {
  if (autoSaveTimer) {
    window.clearTimeout(autoSaveTimer)
  }
})
</script>
