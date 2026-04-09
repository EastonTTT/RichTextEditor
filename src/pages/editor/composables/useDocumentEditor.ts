// 封装编辑器初始化、保存流程和文档状态同步逻辑。
import { computed, ref, type Ref } from 'vue'
import { getUserList } from '@/api/user'
import { readStringArray } from '@/utils/collaborationMeta'
import type { DocumentDetail, DocumentVisibility } from '@/types/document'
import type { OfflineDraftSyncState } from '@/types/offline'
import { getUserDisplayName, type UserProfile } from '@/types/user'

interface UseDocumentEditorOptions {
  storedUser: UserProfile
  draftSyncState: Ref<OfflineDraftSyncState>
  onAutoSave: () => void
  onDraftPersist: (syncState: OfflineDraftSyncState) => void
  onSyncTitleMeta?: (value: string) => void
  onSyncVisibilityMeta?: (value: DocumentVisibility) => void
  getErrorMessage: (error: unknown, fallback: string) => string
}

export function useDocumentEditor(options: UseDocumentEditorOptions) {
  // 这里集中管理“文档本身”的状态，不处理编辑器实例和协同连接。
  const title = ref('未命名文档')
  const ownerId = ref(options.storedUser.id)
  const ownerName = ref(getUserDisplayName(options.storedUser))
  const visibility = ref<DocumentVisibility>('private')
  const persistedVisibility = ref<DocumentVisibility>('private')
  const shareTargetIds = ref<string[]>([])
  const availableUsers = ref<UserProfile[]>([])
  const isSaving = ref(false)
  const isDirty = ref(false)
  const lastSavedAt = ref('')
  const saveError = ref('')
  const latestContentSnapshot = ref('<p></p>')
  const collaborationEnabled = ref(true)
  const templateTitle = ref('')
  const templateDescription = ref('')
  const isSavingTemplate = ref(false)
  const queuedSave = ref(false)

  let autoSaveTimer: number | null = null
  let draftPersistTimer: number | null = null

  const selectedShareUsers = computed(() =>
    availableUsers.value.filter((user) => shareTargetIds.value.includes(user.id)),
  )

  function clearAutoSaveTimer() {
    if (autoSaveTimer) {
      window.clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  function clearDraftPersistTimer() {
    if (draftPersistTimer) {
      window.clearTimeout(draftPersistTimer)
      draftPersistTimer = null
    }
  }

  function scheduleAutoSave() {
    clearAutoSaveTimer()
    // 自动保存做短暂防抖，避免每次输入都直连后端。
    autoSaveTimer = window.setTimeout(() => {
      options.onAutoSave()
    }, 1000)
  }

  function scheduleDraftPersist(syncState: OfflineDraftSyncState = 'pending') {
    clearDraftPersistTimer()
    // 本地草稿写入比远端保存更轻量，可以用更短的节流周期兜底。
    draftPersistTimer = window.setTimeout(() => {
      options.onDraftPersist(syncState)
    }, 350)
  }

  function markDirty() {
    // 所有会改动文档内容或元信息的入口，最终都应该回到这个脏状态入口。
    isDirty.value = true
    saveError.value = ''
    options.draftSyncState.value = options.draftSyncState.value === 'conflict' ? 'conflict' : 'pending'
    scheduleDraftPersist(options.draftSyncState.value)

    if (isSaving.value) {
      queuedSave.value = true
      return
    }

    scheduleAutoSave()
  }

  function applyDocumentState(document: DocumentDetail) {
    // 服务端返回的数据在这里一次性回填，保证界面和持久化状态一致。
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
    collaborationEnabled.value = document.visibility === 'shared'
  }

  function normalizeShareTargets(value: unknown) {
    // 共享列表里不允许把所有者自己再选一遍，避免冗余权限数据。
    const ids = readStringArray(value)
    return ids.filter((id) => id !== ownerId.value)
  }

  function handleTitleChange(value: string) {
    title.value = value
    options.onSyncTitleMeta?.(value)
    markDirty()
  }

  function handleVisibilityChange(value: DocumentVisibility) {
    visibility.value = value

    if (value !== 'shared') {
      collaborationEnabled.value = false
    }

    options.onSyncVisibilityMeta?.(value)
    markDirty()
  }

  function handleShareTargetsChange(value: unknown) {
    shareTargetIds.value = normalizeShareTargets(value)
    markDirty()
  }

  async function loadAvailableUsers() {
    try {
      const users = await getUserList()
      availableUsers.value = users.filter((user) => user.id !== ownerId.value)
    } catch (error) {
      options.getErrorMessage(error, '加载协作者失败')
      availableUsers.value = []
    }
  }

  return {
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
  }
}
