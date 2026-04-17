// 协调离线草稿的持久化、恢复与同步状态。
import { nextTick, ref, type Ref } from 'vue'
import type { Editor as CoreEditor } from '@tiptap/core'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  getOfflineDraft,
  removeOfflineDraft,
  saveOfflineDraft,
} from '@/utils/offlineDraftStore'
import type { DocumentDetail, DocumentVisibility } from '@/types/document'
import type { OfflineDraftRecord, OfflineDraftSyncState } from '@/types/offline'

interface UseOfflineDraftOptions {
  documentId: string
  initialOnlineState: boolean
  draftSyncState: Ref<OfflineDraftSyncState>
  title: Ref<string>
  visibility: Ref<DocumentVisibility>
  shareTargetIds: Ref<string[]>
  isOwner: Ref<boolean>
  latestContentSnapshot: Ref<string>
  lastSavedAt: Ref<string>
  editorInstance: Ref<CoreEditor | null>
  isDirty: Ref<boolean>
  isHydrating: Ref<boolean>
  saveError: Ref<string>
  onSyncEditorStats: (editor: CoreEditor | null) => void
  onRefreshSearchMatches: (editor: CoreEditor | null) => void
}

interface PersistOfflineDraftSnapshotOptions {
  syncUiState?: boolean
}

export function useOfflineDraft(options: UseOfflineDraftOptions) {
  // 离线草稿既服务于断网兜底，也负责在线恢复时的冲突判断。
  const networkState = ref<'online' | 'offline'>(options.initialOnlineState ? 'online' : 'offline')
  const offlineDraft = ref<OfflineDraftRecord | null>(null)
  const isOfflineRecoveryOpen = ref(false)
  const isOfflineConflictOpen = ref(false)
  const isOfflineCenterOpen = ref(false)
  const pendingOfflineDraft = ref<OfflineDraftRecord | null>(null)
  const pendingServerDocument = ref<DocumentDetail | null>(null)
  const isSyncingOfflineDraft = ref(false)
  const isOfflineFallbackMode = ref(false)

  function buildOfflineDraftRecord(syncState: OfflineDraftSyncState): OfflineDraftRecord {
    // 草稿记录保留标题、正文和共享信息，确保恢复后上下文尽量完整。
    const currentEditor = options.editorInstance.value

    return {
      documentId: options.documentId,
      title: options.title.value.trim() || '未命名文档',
      content: currentEditor?.getHTML() || options.latestContentSnapshot.value || '<p></p>',
      visibility: options.visibility.value,
      sharedWithUserIds: options.visibility.value === 'shared' && options.isOwner.value ? [...options.shareTargetIds.value] : [],
      updatedAt: new Date().toISOString(),
      lastServerUpdatedAt: options.lastSavedAt.value || offlineDraft.value?.lastServerUpdatedAt || '',
      syncState,
    }
  }

  async function persistOfflineDraftSnapshot(
    syncState: OfflineDraftSyncState,
    persistOptions: PersistOfflineDraftSnapshotOptions = {},
  ) {
    try {
      const record = buildOfflineDraftRecord(syncState)
      await saveOfflineDraft(record)
      offlineDraft.value = record
      if (persistOptions.syncUiState !== false) {
        options.draftSyncState.value = syncState
      }
    } catch {
      // 忽略 IndexedDB 写入失败，保证编辑器仍可继续使用。
    }
  }

  async function persistOfflineBaseline(document: DocumentDetail, syncState: OfflineDraftSyncState = 'synced') {
    // 每次成功保存后都更新一份“服务器基线”，后续可用它判断离线冲突。
    try {
      const record: OfflineDraftRecord = {
        documentId: document.id,
        title: document.title,
        content: document.content || '<p></p>',
        visibility: document.visibility,
        sharedWithUserIds: [...(document.sharedWithUserIds || [])],
        updatedAt: document.lastModifiedAt,
        lastServerUpdatedAt: document.lastModifiedAt,
        syncState,
      }

      await saveOfflineDraft(record)
      offlineDraft.value = record
      options.draftSyncState.value = syncState
    } catch {
      // 忽略 IndexedDB 写入失败，保证编辑器仍可继续使用。
    }
  }

  async function readOfflineDraftSnapshot() {
    try {
      const draft = await getOfflineDraft(options.documentId)
      offlineDraft.value = draft
      options.draftSyncState.value = draft?.syncState || 'synced'
      return draft
    } catch {
      offlineDraft.value = null
      options.draftSyncState.value = 'synced'
      return null
    }
  }

  async function applyLocalDraftToEditor(draft: OfflineDraftRecord) {
    // 恢复本地草稿时，除了正文，还要把标题、权限等元信息一并回灌。
    options.title.value = draft.title
    options.visibility.value = draft.visibility
    options.shareTargetIds.value = [...draft.sharedWithUserIds]
    options.latestContentSnapshot.value = draft.content || '<p></p>'
    options.isDirty.value = true

    if (options.editorInstance.value) {
      options.isHydrating.value = true
      options.editorInstance.value.commands.setContent(draft.content || '<p></p>', false)
      await nextTick()
      options.isHydrating.value = false
      options.onSyncEditorStats(options.editorInstance.value)
      options.onRefreshSearchMatches(options.editorInstance.value)
    }

    await persistOfflineDraftSnapshot(draft.syncState === 'conflict' ? 'conflict' : 'pending')
  }

  function clearPendingOfflineDialogs() {
    isOfflineRecoveryOpen.value = false
    isOfflineConflictOpen.value = false
    pendingOfflineDraft.value = null
    pendingServerDocument.value = null
  }

  async function openOfflineCenter() {
    await readOfflineDraftSnapshot()
    isOfflineCenterOpen.value = true
  }

  async function restoreDraftFromCenter() {
    if (!offlineDraft.value) {
      return
    }

    await applyLocalDraftToEditor(offlineDraft.value)
    isOfflineCenterOpen.value = false
    ElMessage.success('本地草稿已恢复到编辑器。')
  }

  async function handleClearOfflineDraft() {
    // 清理动作只影响本地 IndexedDB，不会删除服务器上的正式文档。
    if (!offlineDraft.value) {
      return
    }

    try {
      await ElMessageBox.confirm(
        '清理后将删除当前文档的本地离线草稿，仅保留服务器版本。是否继续？',
        '清理本地草稿',
        {
          confirmButtonText: '清理',
          cancelButtonText: '取消',
          type: 'warning',
        },
      )
    } catch {
      return
    }

    await removeOfflineDraft(options.documentId)
    offlineDraft.value = null
    options.draftSyncState.value = 'synced'
    clearPendingOfflineDialogs()
    options.saveError.value = ''
    ElMessage.success('本地草稿已清理。')
  }

  function formatOfflineTime(value?: string | null) {
    if (!value) {
      return '未知'
    }

    return new Date(value).toLocaleString()
  }

  return {
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
  }
}
