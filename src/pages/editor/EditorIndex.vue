<template>
  <div class="editor-page">
    <editor-header
      :editor="editorInstance"
      :title="title"
      :is-saving="isSaving"
      :last-saved-at="lastSavedAt"
      :is-collaborative="isCollaborative"
      :is-dirty="isDirty"
      :save-error="saveError"
      :owner-name="ownerName"
      :visibility="visibility"
      :can-collaborate="canCollaborate"
      :can-manage-sharing="isOwner"
      :word-count="wordCount"
      :character-count="characterCount"
      :search-query="searchQuery"
      :search-match-count="searchMatches.length"
      :active-search-index="activeSearchIndex"
      :collaborators="collaborators"
      @update:title="handleTitleChange"
      @update:visibility="handleVisibilityChange"
      @update:search="handleSearchChange"
      @search-prev="focusPreviousSearchMatch"
      @search-next="focusNextSearchMatch"
      @toggle-settings="isSettingsOpen = true"
      @save="saveCurrentDocument(true)"
      @back="router.push('/home')"
    />

    <div class="wrapper">
      <div class="toc-container">
        <table-of-contents v-if="editorInstance" :editor="editorInstance" class="toc" />
      </div>
      <div class="editor-container">
        <div v-if="canCollaborate" class="collab-banner">
          当前文档已进入共享协同模式，只有被选中的协作者可以访问。
        </div>
        <div v-else-if="isCollaborationAvailable" class="collab-banner muted">
          当前为私有文档。保存为共享并选择协作者后，才会接入协同编辑。
        </div>
        <div v-else class="collab-banner muted">
          当前未配置协同服务地址，正在使用本地编辑模式。
        </div>

        <rich-text-editor
          v-if="editorInstance"
          :editor="editorInstance"
          :can-collaborate="canCollaborate"
          :is-collaborative="isCollaborative"
          @toggle-collaboration="toggleCollaboration"
        />
      </div>
    </div>

    <el-drawer v-model="isSettingsOpen" title="文档设置" size="420px">
      <div class="settings-panel">
        <el-form label-position="top">
          <el-form-item label="标题">
            <el-input :model-value="title" @update:model-value="handleTitleChange" />
          </el-form-item>

          <el-form-item label="所有者">
            <el-input :model-value="ownerName" readonly />
          </el-form-item>

          <el-form-item label="可见性">
            <el-select
              class="settings-field"
              :model-value="visibility"
              :disabled="!isOwner"
              @update:model-value="handleVisibilityChange"
            >
              <el-option label="私有" value="private" />
              <el-option label="共享" value="shared" />
            </el-select>
          </el-form-item>

          <el-form-item label="共享权限">
            <div class="field-tip prominent">
              入口在这里。先将上方“可见性”切换为“共享”，再选择允许访问这篇文档的协作者。
            </div>
          </el-form-item>

          <el-form-item v-if="isOwner && visibility === 'shared'" label="共享给指定用户">
            <el-select
              class="settings-field"
              :model-value="shareTargetIds"
              multiple
              filterable
              collapse-tags
              collapse-tags-tooltip
              placeholder="请选择可以访问此文档的用户"
              @update:model-value="handleShareTargetsChange"
            >
              <el-option
                v-for="user in availableUsers"
                :key="user.id"
                :label="user.name"
                :value="user.id"
              />
            </el-select>
            <div class="field-tip">未被选中的账号将无法在列表、最近访问和协同房间中看到该文档。</div>
          </el-form-item>

          <el-form-item v-else-if="isOwner" label="共享给指定用户">
            <el-input model-value="当前为私有文档，切换为共享后可选择具体协作者。" readonly />
          </el-form-item>

          <el-form-item label="文档 ID">
            <el-input :model-value="documentId" readonly />
          </el-form-item>

          <el-form-item v-if="canCollaborate" label="协同房间">
            <el-input :model-value="roomName" readonly />
          </el-form-item>

          <el-form-item label="最近保存时间">
            <el-input :model-value="lastSavedAt ? new Date(lastSavedAt).toLocaleString() : '尚未保存'" readonly />
          </el-form-item>
        </el-form>

        <div class="settings-card">
          <div class="settings-card-title">共享对象</div>
          <div v-if="selectedShareUsers.length > 0" class="share-chip-list">
            <span
              v-for="user in selectedShareUsers"
              :key="user.id"
              class="share-chip"
              :style="{ '--chip-color': user.color }"
            >
              {{ user.name }}
            </span>
          </div>
          <div v-else class="settings-muted">当前没有额外协作者。</div>
        </div>

        <div class="settings-card">
          <div class="settings-card-title">统计信息</div>
          <div class="settings-stat">字数：{{ wordCount }}</div>
          <div class="settings-stat">字符数：{{ characterCount }}</div>
          <div class="settings-stat">搜索结果：{{ searchMatches.length }}</div>
        </div>

        <div v-if="isOwner" class="settings-card">
          <div class="settings-card-title">保存为模板</div>
          <el-input v-model="templateTitle" placeholder="模板名称" />
          <el-input
            v-model="templateDescription"
            class="template-description"
            type="textarea"
            :rows="3"
            placeholder="模板说明，可用于下次快速复用"
          />
          <el-button class="template-action" type="primary" :loading="isSavingTemplate" @click="handleSaveAsTemplate">
            保存当前文档为模板
          </el-button>
        </div>
      </div>
    </el-drawer>

    <button v-if="showAiAssistant" class="floating-ai-button" type="button" @click="isAssistantOpen = true">
      <span class="floating-ai-button__badge">AI</span>
      <span>文档助手</span>
    </button>

    <el-dialog v-if="showAiAssistant" v-model="isAssistantOpen" title="AI 文档助手" width="520px" destroy-on-close>
      <div class="assistant-panel">
        <div class="assistant-intro">
          AI 助手会基于当前文档内容调用真实模型进行总结或问答。若文档存在未保存修改，会先自动保存再发起请求。请先在
          `CollabServer` 进程环境中配置 `AI_API_KEY` 或 `OPENAI_API_KEY`。
        </div>

        <div class="assistant-actions">
          <el-button :loading="assistantLoading" @click="runAssistantSummary">总结全文</el-button>
          <el-button :loading="assistantLoading" @click="assistantQuestion = '请提炼这篇文档中的待办事项和风险点。'">
            生成待办问题
          </el-button>
        </div>

        <el-input
          v-model="assistantQuestion"
          type="textarea"
          :rows="5"
          placeholder="输入关于当前文档的问题，例如：这篇文档的核心结论是什么？还有哪些待办？"
        />

        <el-button type="primary" :loading="assistantLoading" @click="runAssistantQuestion">提问</el-button>

        <div v-if="assistantAnswer" class="assistant-answer-card">
          <div class="assistant-section-title">回答</div>
          <div class="assistant-answer">{{ assistantAnswer }}</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import * as Y from 'yjs'
import { Editor } from '@tiptap/vue-3'
import { ElMessage } from 'element-plus'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import type { Editor as CoreEditor } from '@tiptap/core'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import RichTextEditor from '@/pages/editor/components/RichTextEditor.vue'
import TableOfContents from '@/pages/editor/components/TableOfContents.vue'
import EditorHeader from './components/EditorHeader.vue'
import { createEditorExtensions } from '@/utils/editorExtensions'
import { normalizeVisibility, readStringArray, setMetaValueIfChanged } from '@/utils/collaborationMeta'
import { getStoredToken, getStoredUser } from '@/utils/localStore'
import { useCollaborationProvider } from '@/utils/useCollaborationProvider'
import '@/styles/editor.scss'
import {
  askDocumentAi,
  getDocumentDetail,
  recordDocumentOpen,
  saveDocument,
  saveDocumentAsTemplate,
} from '@/api/document'
import { getUserList } from '@/api/user'
import type { DocumentDetail, DocumentVisibility } from '@/types/document'
import type { UserProfile } from '@/types/user'

interface SearchMatch {
  from: number
  to: number
}

interface CollaboratorPresence {
  name: string
  color: string
}

interface RequestErrorLike {
  msg?: string
  message?: string
}

type CollaborationRuntime = ReturnType<typeof useCollaborationProvider>

const route = useRoute()
const router = useRouter()
const documentId = route.params.id as string
const collabUrl = import.meta.env.VITE_COLLAB_WS_URL as string | undefined
const storedUser = getStoredUser()
const storedToken = getStoredToken() || undefined

const editorInstance = shallowRef<Editor | null>(null)
const sharedDoc = shallowRef<Y.Doc | null>(null)
const metaMap = shallowRef<Y.Map<unknown> | null>(null)
const collaborationRuntime = shallowRef<CollaborationRuntime | null>(null)

const title = ref('未命名文档')
const ownerId = ref(storedUser.id)
const ownerName = ref(storedUser.name)
const visibility = ref<DocumentVisibility>('private')
const persistedVisibility = ref<DocumentVisibility>('private')
const shareTargetIds = ref<string[]>([])
const availableUsers = ref<UserProfile[]>([])
const isSaving = ref(false)
const isDirty = ref(false)
const lastSavedAt = ref('')
const saveError = ref('')
const isHydrating = ref(false)
const isCollaborative = ref(false)
const hasReceivedInitialSync = ref(false)
const hasSeededCollaborationState = ref(false)
const queuedSave = ref(false)
const wordCount = ref(0)
const characterCount = ref(0)
const isSettingsOpen = ref(false)
const isAssistantOpen = ref(false)
const assistantQuestion = ref('')
const assistantAnswer = ref('')
const assistantLoading = ref(false)
const searchQuery = ref('')
const searchMatches = ref<SearchMatch[]>([])
const activeSearchIndex = ref(-1)
const collaborators = ref<CollaboratorPresence[]>([])
const latestContentSnapshot = ref('<p></p>')
const collaborationEnabled = ref(true)
const templateTitle = ref('')
const templateDescription = ref('')
const isSavingTemplate = ref(false)
let autoSaveTimer: number | null = null
let suppressMetaObserver = false

const roomName = computed(() => `document:${documentId}`)
const isCollaborationAvailable = Boolean(collabUrl)
const canCollaborate = computed(() => Boolean(collabUrl) && persistedVisibility.value === 'shared')
const isOwner = computed(() => ownerId.value === storedUser.id)
const showAiAssistant = false
const selectedShareUsers = computed(() =>
  availableUsers.value.filter((user) => shareTargetIds.value.includes(user.id)),
)

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const maybeError = error as RequestErrorLike
    if (typeof maybeError.msg === 'string' && maybeError.msg.trim()) {
      return maybeError.msg
    }

    if (typeof maybeError.message === 'string' && maybeError.message.trim()) {
      return maybeError.message
    }
  }

  return fallback
}

function syncEditorStats(currentEditor: CoreEditor | null = editorInstance.value ?? null) {
  if (!currentEditor) {
    wordCount.value = 0
    characterCount.value = 0
    return
  }

  wordCount.value = currentEditor.storage.characterCount.words()
  characterCount.value = currentEditor.storage.characterCount.characters()
}

function refreshSearchMatches(currentEditor: CoreEditor | null = editorInstance.value ?? null, preserveIndex = false) {
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
  const currentEditor = editorInstance.value
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
}

function handleEditorUpdate(currentEditor: CoreEditor) {
  if (isHydrating.value) {
    return
  }

  latestContentSnapshot.value = currentEditor.getHTML()
  syncEditorStats(currentEditor)
  refreshSearchMatches(currentEditor, true)
  markDirty()
}

function createBaseEditorOptions() {
  return {
    onUpdate: ({ editor }: { editor: CoreEditor }) => {
      handleEditorUpdate(editor)
    },
    onCreate: ({ editor }: { editor: CoreEditor }) => {
      latestContentSnapshot.value = editor.getHTML()
      syncEditorStats(editor)
      refreshSearchMatches(editor)
    },
  }
}

function createLocalEditor(content: string) {
  editorInstance.value = new Editor({
    extensions: createEditorExtensions(),
    content: content || '<p></p>',
    ...createBaseEditorOptions(),
  })
}

function detachCollaborationListeners() {
  metaMap.value?.unobserve(applyMetaObserver)

  if (collaborationRuntime.value) {
    collaborationRuntime.value.provider.off('status', handleCollaborationStatus)
    collaborationRuntime.value.provider.off('sync', handleCollaborationSync)
    collaborationRuntime.value.awareness.off('change', syncCollaborators)
    collaborationRuntime.value.destroy()
  }

  collaborationRuntime.value = null
  metaMap.value = null

  if (sharedDoc.value) {
    sharedDoc.value.destroy()
    sharedDoc.value = null
  }

  collaborators.value = []
  hasReceivedInitialSync.value = false
  hasSeededCollaborationState.value = false
  isCollaborative.value = false
}

function destroyEditorSession() {
  detachCollaborationListeners()

  if (editorInstance.value) {
    editorInstance.value.destroy()
    editorInstance.value = null
  }
}

function createCollaborativeSession() {
  if (!collabUrl) {
    createLocalEditor(latestContentSnapshot.value)
    return
  }

  const doc = new Y.Doc()
  const runtime = useCollaborationProvider({
    wsUrl: collabUrl,
    roomName: roomName.value,
    doc,
    token: storedToken,
    user: {
      name: storedUser.name,
      color: storedUser.color,
    },
    autoConnect: false,
  })
  const meta = doc.getMap<unknown>('meta')

  sharedDoc.value = doc
  collaborationRuntime.value = runtime
  metaMap.value = meta
  collaborationEnabled.value = true

  runtime.provider.on('status', handleCollaborationStatus)
  runtime.provider.on('sync', handleCollaborationSync)
  runtime.awareness.on('change', syncCollaborators)
  meta.observe(applyMetaObserver)

  editorInstance.value = new Editor({
    extensions: createEditorExtensions({
      ydoc: doc,
      collaborationProvider: runtime.provider,
      collaborationUser: runtime.user,
    }),
    content: undefined,
    ...createBaseEditorOptions(),
  })

  runtime.connect()
}

async function rebuildEditorSession(document: Pick<DocumentDetail, 'content' | 'title' | 'visibility'>) {
  latestContentSnapshot.value = document.content || '<p></p>'
  destroyEditorSession()
  await nextTick()

  if (document.visibility === 'shared' && collabUrl) {
    createCollaborativeSession()
    return
  }

  createLocalEditor(latestContentSnapshot.value)
}

function readMetaIntoState() {
  const map = metaMap.value
  if (!map) {
    return
  }

  const nextTitle = map.get('title')
  const nextVisibility = map.get('visibility')

  if (typeof nextTitle === 'string' && nextTitle.trim()) {
    title.value = nextTitle
  }

  if (map.has('visibility')) {
    visibility.value = normalizeVisibility(nextVisibility)
  }
}

function syncStateIntoMeta() {
  const map = metaMap.value
  if (!map) {
    return
  }

  setMetaValueIfChanged(map, 'title', title.value)
  setMetaValueIfChanged(map, 'visibility', visibility.value)
}

function sharedDocumentHasContent() {
  return Boolean(sharedDoc.value && sharedDoc.value.getXmlFragment('content').length > 0)
}

function sharedMetaHasValues() {
  const map = metaMap.value
  if (!map) {
    return false
  }

  return map.has('title') || map.has('visibility')
}

function applyMetaObserver() {
  readMetaIntoState()

  if (!suppressMetaObserver && !isHydrating.value && hasSeededCollaborationState.value) {
    markDirty()
  }
}

async function seedSharedDocumentFromSnapshot() {
  if (!canCollaborate.value || !hasReceivedInitialSync.value || hasSeededCollaborationState.value) {
    return
  }

  const currentEditor = editorInstance.value
  const map = metaMap.value
  if (!currentEditor || !map) {
    return
  }

  suppressMetaObserver = true

  if (sharedMetaHasValues()) {
    readMetaIntoState()
  } else {
    syncStateIntoMeta()
  }

  if (sharedDocumentHasContent()) {
    latestContentSnapshot.value = currentEditor.getHTML()
  } else {
    isHydrating.value = true
    currentEditor.commands.setContent(latestContentSnapshot.value || '<p></p>', false)
    await nextTick()
    isHydrating.value = false
  }

  isDirty.value = false
  syncEditorStats(currentEditor)
  refreshSearchMatches(currentEditor)
  suppressMetaObserver = false
  hasSeededCollaborationState.value = true
}

function syncCollaborators() {
  const runtime = collaborationRuntime.value
  if (!runtime || !isCollaborative.value || !canCollaborate.value) {
    collaborators.value = []
    return
  }

  const seen = new Set<string>()
  const nextCollaborators: CollaboratorPresence[] = []

  runtime.awareness.getStates().forEach((state: any) => {
    const user = state.user
    if (!user || typeof user.name !== 'string' || !user.name.trim()) {
      return
    }

    const entry = {
      name: user.name.trim(),
      color: typeof user.color === 'string' && user.color ? user.color : '#1677ff',
    }
    const key = `${entry.name}:${entry.color}`
    if (seen.has(key)) {
      return
    }

    seen.add(key)
    nextCollaborators.push(entry)
  })

  collaborators.value = nextCollaborators
}

function handleCollaborationStatus(event: { status: 'connected' | 'disconnected' | 'connecting' }) {
  if (!canCollaborate.value) {
    isCollaborative.value = false
    collaborators.value = []
    return
  }

  isCollaborative.value = event.status === 'connected'
  syncCollaborators()
}

function handleCollaborationSync(isSynced: boolean) {
  hasReceivedInitialSync.value = isSynced
  if (isSynced) {
    void seedSharedDocumentFromSnapshot()
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

function normalizeShareTargets(value: unknown) {
  const ids = readStringArray(value)
  return ids.filter((id) => id !== ownerId.value)
}

function handleTitleChange(value: string) {
  title.value = value

  if (metaMap.value && hasReceivedInitialSync.value) {
    setMetaValueIfChanged(metaMap.value, 'title', value)
  }

  markDirty()
}

function handleVisibilityChange(value: DocumentVisibility) {
  visibility.value = value

  if (value !== 'shared') {
    collaborationEnabled.value = false
  }

  if (metaMap.value && hasReceivedInitialSync.value) {
    setMetaValueIfChanged(metaMap.value, 'visibility', value)
  }

  markDirty()
}

function handleShareTargetsChange(value: unknown) {
  shareTargetIds.value = normalizeShareTargets(value)
  markDirty()
}

async function hydrateDocument() {
  const document = await getDocumentDetail(documentId)

  if (!document) {
    router.replace('/notFound')
    return
  }

  title.value = document.title
  ownerId.value = document.ownerId
  ownerName.value = document.ownerName
  visibility.value = document.visibility
  persistedVisibility.value = document.visibility
  shareTargetIds.value = document.sharedWithUserIds || []
  lastSavedAt.value = document.lastModifiedAt
  latestContentSnapshot.value = document.content || '<p></p>'
  templateTitle.value = `${document.title} 模板`
  templateDescription.value = `${document.title} 的可复用模板`
  saveError.value = ''
  collaborationEnabled.value = document.visibility === 'shared'

  await rebuildEditorSession(document)
  isDirty.value = false
}

async function saveCurrentDocument(force = false) {
  const currentEditor = editorInstance.value
  if (!currentEditor || isHydrating.value) {
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
    const previousPersistedVisibility = persistedVisibility.value
    const document = await saveDocument(documentId, {
      title: title.value.trim() || '未命名文档',
      content: currentEditor.getHTML(),
      visibility: visibility.value,
      sharedWithUserIds: isOwner.value && visibility.value === 'shared' ? shareTargetIds.value : [],
    })

    title.value = document.title
    ownerId.value = document.ownerId
    ownerName.value = document.ownerName
    visibility.value = document.visibility
    persistedVisibility.value = document.visibility
    shareTargetIds.value = document.sharedWithUserIds || []
    lastSavedAt.value = document.lastModifiedAt
    latestContentSnapshot.value = document.content || '<p></p>'
    isDirty.value = false
    collaborationEnabled.value = document.visibility === 'shared'

    if (previousPersistedVisibility !== document.visibility) {
      await rebuildEditorSession(document)
    } else if (document.visibility === 'shared' && metaMap.value) {
      suppressMetaObserver = true
      syncStateIntoMeta()
      suppressMetaObserver = false
    }

    syncEditorStats(editorInstance.value ?? null)
    refreshSearchMatches(editorInstance.value ?? null)
  } catch (error) {
    saveError.value = '保存失败，当前修改仍保留在本地。'
    isDirty.value = true
    const message = getErrorMessage(error, '保存失败')
    if (force) {
      ElMessage.error(message)
    }
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

async function ensureSavedBeforeAction() {
  if (isDirty.value) {
    await saveCurrentDocument(true)
  }
}

async function runAssistantSummary() {
  assistantLoading.value = true
  assistantAnswer.value = ''

  try {
    await ensureSavedBeforeAction()
    const result = await askDocumentAi(documentId, { mode: 'summary' })
    assistantAnswer.value = result.answer
  } catch (error) {
    const message = getErrorMessage(error, 'AI 请求失败')
    ElMessage.error(message)
  } finally {
    assistantLoading.value = false
  }
}

async function runAssistantQuestion() {
  if (!assistantQuestion.value.trim()) {
    ElMessage.warning('请输入问题后再提问。')
    return
  }

  assistantLoading.value = true
  assistantAnswer.value = ''

  try {
    await ensureSavedBeforeAction()
    const result = await askDocumentAi(documentId, {
      mode: 'question',
      prompt: assistantQuestion.value.trim(),
    })
    assistantAnswer.value = result.answer
  } catch (error) {
    const message = getErrorMessage(error, 'AI 请求失败')
    ElMessage.error(message)
  } finally {
    assistantLoading.value = false
  }
}

async function handleSaveAsTemplate() {
  if (!isOwner.value) {
    ElMessage.warning('只有文档所有者可以保存模板。')
    return
  }

  isSavingTemplate.value = true

  try {
    await ensureSavedBeforeAction()
    await saveDocumentAsTemplate(documentId, {
      title: templateTitle.value.trim() || `${title.value} 模板`,
      description: templateDescription.value.trim() || `${title.value} 的可复用模板`,
    })
    ElMessage.success('模板已保存。')
  } catch (error) {
    const message = getErrorMessage(error, '模板保存失败')
    ElMessage.error(message)
  } finally {
    isSavingTemplate.value = false
  }
}

function toggleCollaboration() {
  const runtime = collaborationRuntime.value
  if (!runtime || !canCollaborate.value) {
    return
  }

  collaborationEnabled.value = !collaborationEnabled.value

  if (collaborationEnabled.value) {
    runtime.connect()
    return
  }

  runtime.disconnect()
  isCollaborative.value = false
  collaborators.value = []
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!isDirty.value) {
    return
  }

  event.preventDefault()
  event.returnValue = ''
}

async function loadAvailableUsers() {
  try {
    const users = await getUserList()
    availableUsers.value = users.filter((user) => user.id !== ownerId.value)
  } catch {
    availableUsers.value = []
  }
}

onBeforeRouteLeave(() => {
  if (!isDirty.value) {
    return true
  }

  return window.confirm('当前内容尚未保存，确认离开吗？')
})

onMounted(async () => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  await recordDocumentOpen(documentId)
  await hydrateDocument()
  await loadAvailableUsers()
})

onBeforeUnmount(() => {
  clearAutoSaveTimer()
  window.removeEventListener('beforeunload', handleBeforeUnload)
  destroyEditorSession()
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
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.settings-card-title {
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #667085;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.settings-stat + .settings-stat {
  margin-top: 8px;
}

.settings-muted,
.field-tip {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.7;
  color: #667085;
}

.field-tip.prominent {
  margin-top: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: #eff4ff;
  color: #284b95;
}

.share-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.share-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #eff4ff;
  color: #1d2939;
  font-size: 12px;
}

.share-chip::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--chip-color);
}

.template-description {
  margin-top: 12px;
}

.template-action {
  width: 100%;
  margin-top: 12px;
}

.assistant-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.assistant-intro {
  padding: 14px 16px;
  border-radius: 14px;
  background: linear-gradient(180deg, #eef4ff 0%, #f8fbff 100%);
  color: #35518a;
  line-height: 1.7;
}

.assistant-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.assistant-answer-card {
  padding: 16px;
  border-radius: 16px;
  border: 1px solid #dbe5f5;
  background: #fff;
}

.assistant-section-title {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 700;
  color: #344054;
}

.assistant-answer {
  white-space: pre-wrap;
  line-height: 1.8;
  color: #1d2939;
}

.floating-ai-button {
  position: fixed;
  right: 28px;
  bottom: 28px;
  z-index: 30;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border: none;
  border-radius: 999px;
  background: linear-gradient(135deg, #175ce6, #2f7bff);
  color: #fff;
  font-weight: 700;
  box-shadow: 0 20px 36px rgba(23, 92, 230, 0.28);
  cursor: pointer;
}

.floating-ai-button__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
}

@media (max-width: 960px) {
  .floating-ai-button {
    right: 18px;
    bottom: 18px;
  }
}
</style>
