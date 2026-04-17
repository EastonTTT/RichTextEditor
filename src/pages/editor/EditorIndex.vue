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
      :comment-count="commentCount"
      :word-count="wordCount"
      :character-count="characterCount"
      :search-query="searchQuery"
      :search-match-count="searchMatches.length"
      :active-search-index="activeSearchIndex"
      :collaborators="collaborators"
      :network-state="networkState"
      :draft-sync-state="draftSyncState"
      :show-sync-entry="showHeaderSyncEntry"
      @update:title="handleTitleChange"
      @update:visibility="handleVisibilityChange"
      @update:search="handleSearchChange"
      @search-prev="focusPreviousSearchMatch"
      @search-next="focusNextSearchMatch"
      @toggle-comments="openCommentsDrawer"
      @toggle-settings="isSettingsOpen = true"
      @toggle-versions="openVersionDrawer"
      @open-sync-center="openOfflineCenter"
      @save="saveCurrentDocument(true)"
      @back="router.push('/home')"
    />

    <div class="wrapper">
      <div class="toc-container">
        <table-of-contents v-if="editorInstance" :editor="editorInstance" class="toc" />
      </div>
      <div class="editor-container">
        <div v-if="networkState === 'offline'" class="sync-banner warning">
          当前处于离线编辑模式，修改会先保存在本地，恢复网络后自动同步。
        </div>
        <div v-else-if="draftSyncState === 'pending'" class="sync-banner">
          检测到待同步的本地草稿，系统会在网络稳定后自动回传到服务器。
        </div>
        <div v-else-if="draftSyncState === 'conflict'" class="sync-banner danger">
          本地草稿与服务器版本发生冲突，请先处理后再继续协作。
        </div>

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

    <editor-settings-drawer
      v-model="isSettingsOpen"
      :title="title"
      :owner-name="ownerName"
      :visibility="visibility"
      :is-owner="isOwner"
      :share-target-ids="shareTargetIds"
      :available-users="availableUsers"
      :document-id="documentId"
      :can-collaborate="canCollaborate"
      :room-name="roomName"
      :last-saved-at="lastSavedAt"
      :selected-share-users="selectedShareUsers"
      :word-count="wordCount"
      :character-count="characterCount"
      :search-match-count="searchMatches.length"
      :template-title="templateTitle"
      :template-description="templateDescription"
      :is-saving-template="isSavingTemplate"
      @update:title="handleTitleChange"
      @update:visibility="handleVisibilityChange"
      @update:share-target-ids="handleShareTargetsChange"
      @update:template-title="templateTitle = $event"
      @update:template-description="templateDescription = $event"
      @save-template="handleSaveAsTemplate"
    />

    <editor-offline-center-drawer
      v-model="isOfflineCenterOpen"
      :draft-sync-state="draftSyncState"
      :offline-status-title="offlineStatusTitle"
      :offline-status-description="offlineStatusDescription"
      :network-state="networkState"
      :offline-sync-state-label="offlineSyncStateLabel"
      :has-offline-draft="Boolean(offlineDraft)"
      :offline-draft-updated-at="formatOfflineTime(offlineDraft?.updatedAt)"
      :server-baseline-time="formatOfflineTime(offlineDraft?.lastServerUpdatedAt || lastSavedAt)"
      :is-syncing-offline-draft="isSyncingOfflineDraft"
      @sync="syncPendingOfflineDraft"
      @open-conflict="isOfflineConflictOpen = true"
      @restore-draft="restoreDraftFromCenter"
      @clear-draft="handleClearOfflineDraft"
    />

    <editor-versions-drawer
      v-model="isVersionsOpen"
      :is-version-action-running="isVersionActionRunning"
      :is-versions-loading="isVersionsLoading"
      :versions="versions"
      :last-saved-at="lastSavedAt"
      @create-snapshot="handleCreateSnapshot"
      @refresh="loadVersions"
      @preview="previewVersion"
      @restore="handleRestoreVersion"
    />

    <editor-comments-drawer
      v-model="isCommentsOpen"
      :new-comment-content="newCommentContent"
      :comment-count="commentCount"
      :is-comments-loading="isCommentsLoading"
      :is-comment-submitting="isCommentSubmitting"
      :comment-threads="commentThreads"
      :reply-drafts="replyDrafts"
      :format-comment-time="formatCommentTime"
      @update:new-comment-content="newCommentContent = $event"
      @refresh="loadCommentThreads"
      @create-comment="handleCreateComment"
      @update:reply-draft="updateReplyDraft"
      @clear-reply="clearReplyDraft"
      @reply-comment="handleReplyComment"
    />

    <el-dialog v-model="isVersionPreviewOpen" title="版本预览" width="min(1000px, 92vw)" destroy-on-close>
      <template v-if="selectedVersionPreview">
        <div class="preview-meta">
          <strong>v{{ selectedVersionPreview.versionNo }}</strong>
          <span>{{ selectedVersionPreview.reason }}</span>
          <span>{{ formatVersionTime(selectedVersionPreview.createdAt) }}</span>
        </div>
        <div class="preview-panels">
          <section class="preview-panel">
            <header>当前文档</header>
            <div class="preview-content" v-html="latestContentSnapshot || '<p></p>'"></div>
          </section>
          <section class="preview-panel">
            <header>历史版本</header>
            <div class="preview-content" v-html="selectedVersionPreview.content || '<p></p>'"></div>
          </section>
        </div>
        <div class="diff-summary">
          <span>新增块 {{ diffStats.added }}</span>
          <span>删除块 {{ diffStats.removed }}</span>
          <span>变更块 {{ diffStats.changed }}</span>
          <span v-if="diffTruncated">仅展示前 {{ diffRows.length }} 项</span>
        </div>
        <div class="diff-list">
          <div v-for="(row, index) in diffRows" :key="`${row.type}-${index}`" class="diff-row" :class="`diff-${row.type}`">
            <span class="diff-tag">{{ diffTagMap[row.type] }}</span>
            <div class="diff-main">
              <div class="diff-kind">{{ blockKindLabels[row.blockType] || row.blockType }}</div>
              <template v-if="row.type === 'changed'">
                <div class="diff-columns">
                  <div>
                    <strong>当前</strong>
                    <pre>{{ row.currentText || ' ' }}</pre>
                  </div>
                  <div>
                    <strong>版本</strong>
                    <pre>{{ row.versionText || ' ' }}</pre>
                  </div>
                </div>
              </template>
              <pre v-else>{{ row.text || ' ' }}</pre>
            </div>
          </div>
          <el-empty v-if="!diffRows.length" description="当前内容与该版本没有块级差异" />
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="isOfflineRecoveryOpen"
      title="检测到本地草稿"
      width="460px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="offline-dialog-body">
        <p>检测到这篇文档在本地还有未同步内容，是否恢复到编辑器？</p>
        <div class="offline-dialog-meta">
          <span>本地修改时间：{{ formatOfflineTime(pendingOfflineDraft?.updatedAt) }}</span>
          <span>服务器时间：{{ formatOfflineTime(pendingServerDocument?.lastModifiedAt) }}</span>
        </div>
      </div>
      <template #footer>
        <div class="offline-dialog-actions">
          <el-button @click="discardPendingOfflineDraft">保留服务器版本</el-button>
          <el-button type="primary" @click="restorePendingOfflineDraft">恢复本地草稿</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog
      v-model="isOfflineConflictOpen"
      title="发现同步冲突"
      width="560px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <div class="offline-dialog-body">
        <p>服务器内容在你离线期间已经被更新。你可以覆盖服务器、保留服务器，或把本地草稿另存为冲突副本。</p>
        <div class="offline-dialog-meta">
          <span>本地修改时间：{{ formatOfflineTime(pendingOfflineDraft?.updatedAt) }}</span>
          <span>服务器时间：{{ formatOfflineTime(pendingServerDocument?.lastModifiedAt) }}</span>
        </div>
      </div>
      <template #footer>
        <div class="offline-dialog-actions split">
          <el-button @click="discardPendingOfflineDraft">保留服务器版本</el-button>
          <el-button @click="createConflictCopyFromDraft">生成冲突副本</el-button>
          <el-button type="primary" @click="restorePendingOfflineDraft(true)">使用本地版本覆盖服务器</el-button>
        </div>
      </template>
    </el-dialog>

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
// 组合完整的文档编辑页、抽屉面板和编辑流程。
import { ElMessage } from 'element-plus'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import RichTextEditor from '@/pages/editor/components/RichTextEditor.vue'
import TableOfContents from '@/pages/editor/components/TableOfContents.vue'
import EditorHeader from './components/EditorHeader.vue'
import EditorCommentsDrawer from './components/EditorCommentsDrawer.vue'
import EditorOfflineCenterDrawer from './components/EditorOfflineCenterDrawer.vue'
import EditorSettingsDrawer from './components/EditorSettingsDrawer.vue'
import EditorVersionsDrawer from './components/EditorVersionsDrawer.vue'
import { useDocumentAssistant } from './composables/useDocumentAssistant'
import { useDocumentComments } from './composables/useDocumentComments'
import { useDocumentEditor } from './composables/useDocumentEditor'
import { useEditorCollaboration } from './composables/useEditorCollaboration'
import { useEditorSearch } from './composables/useEditorSearch'
import { useOfflineDraft } from './composables/useOfflineDraft'
import { useDocumentVersions } from './composables/useDocumentVersions'
import { useOfflineDraftPresentation } from './composables/useOfflineDraftPresentation'
import {
  blockKindLabels,
  diffTagMap,
  formatVersionTime,
  getVersionReasonMeta,
} from './composables/useVersionPresentation'
import { getStoredToken, getStoredUser } from '@/utils/localStore'
import '@/styles/editor.scss'
import {
  createDocument,
  getDocumentDetail,
  recordDocumentOpen,
  saveDocument,
  saveDocumentAsTemplate,
} from '@/api/document'
import type { DocumentDetail } from '@/types/document'
import type { OfflineDraftSyncState } from '@/types/offline'
import { getUserDisplayName } from '@/types/user'
import { removeOfflineDraft, updateOfflineDraftSyncState } from '@/utils/offlineDraftStore'

interface RequestErrorLike {
  msg?: string
  message?: string
}

// 这个页面是编辑器总控层：聚合文档、协同、离线、评论、版本和 AI 助手等能力。
const route = useRoute()
const router = useRouter()
const documentId = route.params.id as string
const collabUrl = import.meta.env.VITE_COLLAB_WS_URL as string | undefined
const storedUser = getStoredUser()
const storedToken = getStoredToken() || undefined
const initialOnlineState = typeof navigator === 'undefined' ? true : navigator.onLine

const isHydrating = ref(false)
const isSettingsOpen = ref(false)
const isCommentsOpen = ref(false)
const draftSyncState = ref<OfflineDraftSyncState>('synced')

const roomName = computed(() => `document:${documentId}`)
const isCollaborationAvailable = Boolean(collabUrl)
// 文档基础信息、脏状态和自动保存节奏都由 useDocumentEditor 统一维护。
const {
  title,
  ownerId,
  ownerName,
  visibility,
  persistedVisibility,
  shareTargetIds,
  availableUsers,
  isSaving,
  isDirty,
  lastSavedAt,
  saveError,
  latestContentSnapshot,
  collaborationEnabled,
  templateTitle,
  templateDescription,
  isSavingTemplate,
  queuedSave,
  selectedShareUsers,
  clearAutoSaveTimer,
  clearDraftPersistTimer,
  scheduleAutoSave,
  markDirty,
  applyDocumentState,
  handleTitleChange,
  handleVisibilityChange,
  handleShareTargetsChange,
  loadAvailableUsers,
} = useDocumentEditor({
  storedUser,
  draftSyncState,
  onAutoSave: () => {
    void saveCurrentDocument()
  },
  onDraftPersist: (syncState, persistOptions) => {
    void persistOfflineDraftSnapshot(syncState, persistOptions)
  },
  onSyncTitleMeta: (value) => syncTitleToMeta(value),
  onSyncVisibilityMeta: (value) => syncVisibilityToMeta(value),
  getErrorMessage,
})
const canCollaborate = computed(() => Boolean(collabUrl) && persistedVisibility.value === 'shared')
const isOwner = computed(() => ownerId.value === storedUser.id)
const showAiAssistant = false
// 搜索、字数统计和编辑器 update 生命周期共用一套基础回调。
const {
  wordCount,
  characterCount,
  searchQuery,
  searchMatches,
  activeSearchIndex,
  syncEditorStats,
  refreshSearchMatches,
  focusNextSearchMatch,
  focusPreviousSearchMatch,
  handleSearchChange,
  createBaseEditorOptions,
} = useEditorSearch({
  latestContentSnapshot,
  isHydrating,
  getEditor: () => editorInstance.value ?? null,
  onMarkDirty: markDirty,
})
// 本地编辑器与协同编辑器的切换，都通过这个 composable 做统一封装。
const {
  editorInstance,
  metaMap,
  isCollaborative,
  collaborators,
  suppressMetaObserver,
  destroyEditorSession,
  rebuildEditorSession,
  syncStateIntoMeta,
  toggleCollaboration,
  syncTitleToMeta,
  syncVisibilityToMeta,
} = useEditorCollaboration({
  collabUrl,
  roomName,
  storedToken,
  storedUser,
  canCollaborate,
  title,
  visibility,
  latestContentSnapshot,
  collaborationEnabled,
  isHydrating,
  onMarkDirty: markDirty,
  onSyncEditorStats: (editor) => syncEditorStats(editor),
  onRefreshSearchMatches: (editor, preserveIndex) => refreshSearchMatches(editor, preserveIndex),
  createBaseEditorOptions: () => createBaseEditorOptions(),
})
// 离线草稿模块负责 IndexedDB 持久化、恢复提示和冲突处理上下文。
const {
  networkState,
  offlineDraft,
  isOfflineRecoveryOpen,
  isOfflineConflictOpen,
  isOfflineCenterOpen,
  pendingOfflineDraft,
  pendingServerDocument,
  isSyncingOfflineDraft,
  isOfflineFallbackMode,
  persistOfflineDraftSnapshot,
  persistOfflineBaseline,
  readOfflineDraftSnapshot,
  applyLocalDraftToEditor,
  clearPendingOfflineDialogs,
  openOfflineCenter,
  restoreDraftFromCenter,
  handleClearOfflineDraft,
  formatOfflineTime,
} = useOfflineDraft({
  documentId,
  initialOnlineState,
  draftSyncState,
  title,
  visibility,
  shareTargetIds,
  isOwner,
  latestContentSnapshot,
  lastSavedAt,
  editorInstance,
  isDirty,
  isHydrating,
  saveError,
  onSyncEditorStats: (editor) => syncEditorStats(editor),
  onRefreshSearchMatches: (editor) => refreshSearchMatches(editor),
})
const { offlineSyncStateLabel, offlineStatusTitle, offlineStatusDescription } = useOfflineDraftPresentation(
  networkState,
  draftSyncState,
)
const showHeaderSyncEntry = computed(() => false)

function getErrorMessage(error: unknown, fallback: string) {
  // 优先透传后端可读错误，再退回通用提示。
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

// 评论和版本能力都按需初始化，避免页面首屏加载过重。
const {
  commentThreads,
  isCommentsLoading,
  isCommentSubmitting,
  newCommentContent,
  replyDrafts,
  commentCount,
  formatCommentTime,
  updateReplyDraft,
  clearReplyDraft,
  loadCommentThreads,
  handleCreateComment,
  handleReplyComment,
  startCommentsPolling,
  stopCommentsPolling,
} = useDocumentComments({
  documentId,
  currentUser: storedUser,
  getErrorMessage,
})

function isNetworkError(error: unknown) {
  // 这里做一个宽松判断，兼容 axios/networkState 两类来源的离线信号。
  if (networkState.value === 'offline') {
    return true
  }

  if (error && typeof error === 'object') {
    const maybeError = error as RequestErrorLike & {
      code?: string
    }

    if (maybeError.code === 'ERR_NETWORK') {
      return true
    }

    if (typeof maybeError.message === 'string' && maybeError.message.toLowerCase().includes('network')) {
      return true
    }
  }

  return false
}

async function openCommentsDrawer() {
  isCommentsOpen.value = true
  await loadCommentThreads()
}

const {
  isVersionsOpen,
  isVersionPreviewOpen,
  versions,
  selectedVersionPreview,
  isVersionsLoading,
  isVersionActionRunning,
  diffRows,
  diffTruncated,
  diffStats,
  loadVersions,
  openVersionDrawer,
  previewVersion,
  handleCreateSnapshot,
  handleRestoreVersion,
} = useDocumentVersions({
  documentId,
  title,
  visibility,
  shareTargetIds,
  isOwner,
  persistedVisibility,
  latestContentSnapshot,
  editorInstance,
  isDirty,
  isHydrating,
  applyDocumentState,
  persistOfflineBaseline,
  rebuildEditorSession,
  syncEditorStats,
  refreshSearchMatches,
  getErrorMessage,
})

async function hydrateDocument() {
  // 页面初始化时优先读取本地草稿，再决定采用服务器版本还是离线兜底版本。
  const localDraft = await readOfflineDraftSnapshot()

  try {
    const document = await getDocumentDetail(documentId)

    if (!document) {
      if (localDraft) {
        networkState.value = 'offline'
        isOfflineFallbackMode.value = true
        lastSavedAt.value = localDraft.lastServerUpdatedAt
        latestContentSnapshot.value = localDraft.content || '<p></p>'
        await rebuildEditorSession(
          {
            content: localDraft.content,
            title: localDraft.title,
            visibility: localDraft.visibility,
          },
          { forceLocal: true },
        )
        await applyLocalDraftToEditor(localDraft)
        ElMessage.warning('服务器暂时不可用，已恢复本地草稿。')
        return
      }

      router.replace('/notFound')
      return
    }

    networkState.value = 'online'
    isOfflineFallbackMode.value = false
    applyDocumentState(document)
    saveError.value = ''

    await rebuildEditorSession(document)
    isDirty.value = false

    if (!localDraft || localDraft.syncState === 'synced') {
      await persistOfflineBaseline(document)
      return
    }

    draftSyncState.value = localDraft.syncState
    pendingOfflineDraft.value = localDraft
    pendingServerDocument.value = document

    if (localDraft.lastServerUpdatedAt && localDraft.lastServerUpdatedAt !== document.lastModifiedAt) {
      draftSyncState.value = 'conflict'
      await updateOfflineDraftSyncState(documentId, 'conflict')
      isOfflineConflictOpen.value = true
      return
    }

    isOfflineRecoveryOpen.value = true
  } catch (error) {
    if (!localDraft || !isNetworkError(error)) {
      throw error
    }

    networkState.value = 'offline'
    isOfflineFallbackMode.value = true
    lastSavedAt.value = localDraft.lastServerUpdatedAt
    latestContentSnapshot.value = localDraft.content || '<p></p>'
    await rebuildEditorSession(
      {
        content: localDraft.content,
        title: localDraft.title,
        visibility: localDraft.visibility,
      },
      { forceLocal: true },
    )
    await applyLocalDraftToEditor(localDraft)
    saveError.value = '当前离线，正在使用本地草稿。'
    ElMessage.warning('网络不可用，已切换到本地草稿模式。')
  }
}

async function saveCurrentDocument(
  force = false,
  options: {
    createVersion?: boolean
    versionReason?: string
    versionSummary?: string
  } = {},
) {
  // 保存逻辑同时承担自动保存、手动保存和“受保护动作前强制保存”三类场景。
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

  if (networkState.value === 'offline') {
    await persistOfflineDraftSnapshot(draftSyncState.value === 'conflict' ? 'conflict' : 'pending')
    saveError.value = '当前离线，修改已保存到本地草稿。'
    if (force) {
      ElMessage.warning('当前离线，修改已保存到本地草稿。')
    }
    return
  }

  clearAutoSaveTimer()
  isSaving.value = true
  draftSyncState.value = draftSyncState.value === 'conflict' ? 'conflict' : 'syncing'
  saveError.value = ''

  try {
    const previousPersistedVisibility = persistedVisibility.value
    const document = await saveDocument(documentId, {
      title: title.value.trim() || '未命名文档',
      content: currentEditor.getHTML(),
      visibility: visibility.value,
      sharedWithUserIds: isOwner.value && visibility.value === 'shared' ? shareTargetIds.value : [],
      createVersion: options.createVersion ?? true,
      versionReason: options.versionReason || (force ? 'manual_save' : 'autosave'),
      versionSummary:
        options.versionSummary ||
        (force ? 'Saved from editor header or protected action' : 'Auto snapshot after background save'),
    })

    applyDocumentState(document)
    isDirty.value = false
    collaborationEnabled.value = document.visibility === 'shared'
    networkState.value = 'online'
    isOfflineFallbackMode.value = false
    await persistOfflineBaseline(document)

    if (previousPersistedVisibility !== document.visibility) {
      await rebuildEditorSession(document)
    } else if (document.visibility === 'shared' && metaMap.value) {
      suppressMetaObserver.value = true
      syncStateIntoMeta()
      suppressMetaObserver.value = false
    }

    syncEditorStats(editorInstance.value ?? null)
    refreshSearchMatches(editorInstance.value ?? null)
    if (isVersionsOpen.value) {
      await loadVersions()
    }
  } catch (error) {
    const networkFailure = isNetworkError(error)
    if (networkFailure) {
      networkState.value = 'offline'
      draftSyncState.value = 'pending'
      await persistOfflineDraftSnapshot('pending')
      saveError.value = '网络中断，当前修改已保存到本地草稿。'
    } else {
      draftSyncState.value = draftSyncState.value === 'conflict' ? 'conflict' : 'pending'
      saveError.value = '保存失败，当前修改仍保留在本地。'
    }
    isDirty.value = true
    const message = getErrorMessage(error, '保存失败')
    if (force) {
      if (networkFailure) {
        ElMessage.warning('网络中断，当前修改已保存到本地草稿。')
      } else {
        ElMessage.error(message)
      }
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

// 下面这组函数处理离线恢复分支：保留服务器、恢复本地，或另存冲突副本。
async function discardPendingOfflineDraft() {
  const serverDocument = pendingServerDocument.value
  if (serverDocument) {
    applyDocumentState(serverDocument)
    await rebuildEditorSession(serverDocument)
    isDirty.value = false
    await persistOfflineBaseline(serverDocument)
  } else {
    await removeOfflineDraft(documentId)
    offlineDraft.value = null
    draftSyncState.value = 'synced'
  }

  saveError.value = ''
  isOfflineCenterOpen.value = false
  clearPendingOfflineDialogs()
}

async function restorePendingOfflineDraft(syncToServer = false) {
  const draft = pendingOfflineDraft.value
  if (!draft) {
    clearPendingOfflineDialogs()
    return
  }

  await applyLocalDraftToEditor(draft)
  clearPendingOfflineDialogs()

  if (syncToServer) {
    networkState.value = 'online'
    await saveCurrentDocument(true, {
      createVersion: true,
      versionReason: 'offline_restore',
      versionSummary: 'Recovered offline draft after reconnect',
    })
    return
  }

  ElMessage.success('本地草稿已恢复到编辑器。')
}

async function createConflictCopyFromDraft() {
  const draft = pendingOfflineDraft.value
  if (!draft) {
    clearPendingOfflineDialogs()
    return
  }

  try {
    await createDocument({
      title: `${draft.title}（冲突副本）`,
      content: draft.content,
      visibility: 'private',
      author: getUserDisplayName(storedUser),
    })
    await removeOfflineDraft(documentId)
    offlineDraft.value = null
    if (pendingServerDocument.value) {
      await persistOfflineBaseline(pendingServerDocument.value)
    } else {
      draftSyncState.value = 'synced'
    }
    saveError.value = ''
    isOfflineCenterOpen.value = false
    clearPendingOfflineDialogs()
    ElMessage.success('已生成冲突副本，原文档保留服务器版本。')
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '生成冲突副本失败'))
  }
}

async function syncPendingOfflineDraft() {
  // 网络恢复后，先比对本地草稿基线与服务器时间，再决定直传还是进入冲突处理。
  if (isSyncingOfflineDraft.value || draftSyncState.value === 'synced') {
    return
  }

  if (isOfflineRecoveryOpen.value || isOfflineConflictOpen.value) {
    return
  }

  const draft = await readOfflineDraftSnapshot()
  if (!draft || draft.syncState === 'synced') {
    return
  }

  if (networkState.value === 'offline') {
    return
  }

  isSyncingOfflineDraft.value = true
  draftSyncState.value = draft.syncState === 'conflict' ? 'conflict' : 'syncing'

  try {
    const serverDocument = await getDocumentDetail(documentId)

    if (!serverDocument) {
      return
    }

    if (draft.lastServerUpdatedAt && draft.lastServerUpdatedAt !== serverDocument.lastModifiedAt) {
      pendingOfflineDraft.value = draft
      pendingServerDocument.value = serverDocument
      draftSyncState.value = 'conflict'
      await updateOfflineDraftSyncState(documentId, 'conflict')
      isOfflineConflictOpen.value = true
      saveError.value = '检测到本地草稿与服务器版本冲突。'
      return
    }

    draftSyncState.value = 'syncing'
    await updateOfflineDraftSyncState(documentId, 'syncing')
    const document = await saveDocument(documentId, {
      title: draft.title,
      content: draft.content,
      visibility: draft.visibility,
      sharedWithUserIds: draft.visibility === 'shared' && isOwner.value ? draft.sharedWithUserIds : [],
      createVersion: true,
      versionReason: 'offline_reconnect',
      versionSummary: 'Recovered pending local draft after reconnect',
    })

    const shouldRebuildSession = isOfflineFallbackMode.value || persistedVisibility.value !== document.visibility
    applyDocumentState(document)
    isDirty.value = false
    networkState.value = 'online'
    isOfflineFallbackMode.value = false
    saveError.value = ''
    await persistOfflineBaseline(document)

    if (shouldRebuildSession) {
      await rebuildEditorSession(document)
    } else if (editorInstance.value && editorInstance.value.getHTML() !== document.content) {
      isHydrating.value = true
      editorInstance.value.commands.setContent(document.content || '<p></p>', false)
      await nextTick()
      isHydrating.value = false
      syncEditorStats(editorInstance.value)
      refreshSearchMatches(editorInstance.value)
    }

    isOfflineCenterOpen.value = false
    clearPendingOfflineDialogs()
    ElMessage.success('本地草稿已同步到服务器。')
  } catch (error) {
    if (isNetworkError(error)) {
      networkState.value = 'offline'
      draftSyncState.value = 'pending'
      await updateOfflineDraftSyncState(documentId, 'pending')
    } else {
      draftSyncState.value = 'conflict'
      await updateOfflineDraftSyncState(documentId, 'conflict')
      saveError.value = getErrorMessage(error, '同步本地草稿失败')
    }
  } finally {
    isSyncingOfflineDraft.value = false
  }
}

function handleNetworkOnline() {
  networkState.value = 'online'
  void syncPendingOfflineDraft()
}

function handleNetworkOffline() {
  networkState.value = 'offline'
}

async function ensureSavedBeforeAction() {
  // 模板保存、AI 提问等动作都依赖一个最新的已保存版本。
  if (isDirty.value) {
    await saveCurrentDocument(true)
  }
}

const {
  isAssistantOpen,
  assistantQuestion,
  assistantAnswer,
  assistantLoading,
  runAssistantSummary,
  runAssistantQuestion,
} = useDocumentAssistant({
  documentId,
  ensureSavedBeforeAction,
  getErrorMessage,
})

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

  return window.confirm('当前内容尚未保存，确认离开吗？')
})

onMounted(async () => {
  // 首次进入页面时，先挂载浏览器级监听，再加载文档和辅助数据。
  window.addEventListener('beforeunload', handleBeforeUnload)
  window.addEventListener('online', handleNetworkOnline)
  window.addEventListener('offline', handleNetworkOffline)

  try {
    await recordDocumentOpen(documentId)
  } catch {
    // 忽略最近访问记录写入失败，避免影响编辑页正常打开。
  }

  try {
    await hydrateDocument()
  } catch (error) {
    ElMessage.error(getErrorMessage(error, '文档加载失败'))
    router.replace('/home')
    return
  }

  await loadAvailableUsers()

  if (networkState.value === 'online') {
    await syncPendingOfflineDraft()
  }
})

watch(isCommentsOpen, (open) => {
  // 评论轮询只在抽屉打开时运行，关闭后立即停止。
  if (open) {
    startCommentsPolling(isCommentsOpen)
    return
  }

  stopCommentsPolling()
})

onBeforeUnmount(() => {
  // 页面销毁时要同时清理编辑器实例、轮询器和浏览器事件。
  clearAutoSaveTimer()
  stopCommentsPolling()
  clearDraftPersistTimer()
  window.removeEventListener('beforeunload', handleBeforeUnload)
  window.removeEventListener('online', handleNetworkOnline)
  window.removeEventListener('offline', handleNetworkOffline)
  destroyEditorSession()
})
</script>

<style lang="scss" scoped>
.sync-banner {
  margin-bottom: 12px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #eef4ff;
  color: #284b95;
  line-height: 1.7;
}

.sync-banner.warning {
  background: #fff5e8;
  color: #b54708;
}

.sync-banner.danger {
  background: #fff1f3;
  color: #c01048;
}

.preview-meta,
.preview-panels {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.preview-meta {
  margin-bottom: 8px;
}

.preview-meta {
  color: #667085;
  font-size: 12px;
}

.preview-panels {
  align-items: stretch;
}

.preview-panel {
  flex: 1;
  min-width: 0;
}

.preview-panel header {
  margin-bottom: 8px;
  font-size: 13px;
  color: #475467;
}

.preview-content {
  min-height: 240px;
  max-height: 360px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}

.diff-summary {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin: 16px 0 10px;
  color: #667085;
  font-size: 12px;
}

.diff-list {
  max-height: 320px;
  overflow: auto;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 10px;
  background: #fff;
}

.diff-row {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 12px;
  align-items: start;
  padding: 8px 10px;
  border-radius: 8px;
}

.diff-row + .diff-row {
  margin-top: 6px;
}

.diff-main {
  min-width: 0;
}

.diff-kind {
  font-size: 12px;
  color: #667085;
  margin-bottom: 6px;
}

.diff-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.diff-row pre {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
  font-family: inherit;
}

.diff-added {
  background: #edfdf3;
}

.diff-removed {
  background: #fff1f2;
}

.diff-changed {
  background: #eff6ff;
}

.diff-tag {
  font-size: 12px;
  color: #667085;
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

.offline-dialog-body {
  color: #344054;
  line-height: 1.8;
}

.offline-dialog-body p {
  margin: 0;
}

.offline-dialog-meta {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8fafc;
  color: #667085;
  font-size: 12px;
}

.offline-dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.offline-dialog-actions.split {
  justify-content: space-between;
  flex-wrap: wrap;
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
