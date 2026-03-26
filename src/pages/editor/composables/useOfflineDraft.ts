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

export function useOfflineDraft(options: UseOfflineDraftOptions) {
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

  async function persistOfflineDraftSnapshot(syncState: OfflineDraftSyncState) {
    try {
      const record = buildOfflineDraftRecord(syncState)
      await saveOfflineDraft(record)
      offlineDraft.value = record
      options.draftSyncState.value = syncState
    } catch {
      // Ignore IndexedDB failures and keep the editor usable.
    }
  }

  async function persistOfflineBaseline(document: DocumentDetail, syncState: OfflineDraftSyncState = 'synced') {
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
      // Ignore IndexedDB failures and keep the editor usable.
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
