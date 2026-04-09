// 封装知识库的加载、编辑和保存行为。
import { computed, ref } from 'vue'
import { getKnowledgeBaseDetail, saveKnowledgeBase } from '@/api/knowledgeBase'
import { arraysEqual } from '@/utils/collaborationMeta'
import type { DocumentVisibility } from '@/types/document'

interface KnowledgeBaseSnapshot {
  title: string
  ownerName: string
  description: string
  tags: string[]
  relatedDocumentIds: string[]
  visibility: DocumentVisibility
  lastModifiedAt: string
}

interface UseKnowledgeBaseEditorOptions {
  knowledgeBaseId: string
  onSyncTitle?: (value: string) => void
  onSyncDescription?: (value: string) => void
  onSyncTags?: (value: string[]) => void
  onSyncVisibility?: (value: DocumentVisibility) => void
  onAfterHydrate?: () => void
  onAfterSave?: () => void
  onAfterVisibilityChange?: () => void
  onNotFound?: () => void
}

export function useKnowledgeBaseEditor(options: UseKnowledgeBaseEditorOptions) {
  // 这个 composable 负责知识库的基础表单状态与自动保存，不关心文档选择器。
  const title = ref('未命名知识库')
  const titleDraft = ref('未命名知识库')
  const isTitleFocused = ref(false)
  const ownerName = ref('')
  const description = ref('用于归档同一主题下的多篇文档。')
  const tags = ref<string[]>([])
  const relatedDocumentIds = ref<string[]>([])
  const visibility = ref<DocumentVisibility>('private')
  const persistedVisibility = ref<DocumentVisibility>('private')
  const isSaving = ref(false)
  const isDirty = ref(false)
  const lastSavedAt = ref('')
  const saveError = ref('')
  const queuedSave = ref(false)

  let autoSaveTimer: number | null = null

  const tagsInput = computed(() => tags.value.join('，'))
  const saveStatusLabel = computed(() => {
    // 顶部状态文案来自同一组源状态，避免页面里散落多套判断。
    if (saveError.value) {
      return saveError.value
    }

    if (isSaving.value) {
      return '正在保存...'
    }

    if (isDirty.value) {
      return '有变更待保存'
    }

    if (!lastSavedAt.value) {
      return '尚未保存'
    }

    return `上次保存：${new Date(lastSavedAt.value).toLocaleString()}`
  })

  function syncTitleDraft(force = false) {
    if (force || !isTitleFocused.value || titleDraft.value === title.value) {
      titleDraft.value = title.value
    }
  }

  function applyKnowledgeBaseState(knowledgeBase: KnowledgeBaseSnapshot) {
    // 服务端状态回填后，要同步 titleDraft，避免输入框和真实标题脱节。
    title.value = knowledgeBase.title
    ownerName.value = knowledgeBase.ownerName
    description.value = knowledgeBase.description
    tags.value = knowledgeBase.tags
    relatedDocumentIds.value = knowledgeBase.relatedDocumentIds
    visibility.value = knowledgeBase.visibility
    persistedVisibility.value = knowledgeBase.visibility
    lastSavedAt.value = knowledgeBase.lastModifiedAt
    saveError.value = ''
    syncTitleDraft(true)
  }

  async function hydrateKnowledgeBase() {
    const knowledgeBase = await getKnowledgeBaseDetail(options.knowledgeBaseId)
    if (!knowledgeBase) {
      options.onNotFound?.()
      return
    }

    applyKnowledgeBaseState(knowledgeBase)
    options.onAfterHydrate?.()
  }

  function clearAutoSaveTimer() {
    if (autoSaveTimer) {
      window.clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  function scheduleAutoSave() {
    clearAutoSaveTimer()
    // 知识库元信息更新频率相对低一些，短防抖即可覆盖大部分输入场景。
    autoSaveTimer = window.setTimeout(() => {
      void saveCurrentKnowledgeBase()
    }, 900)
  }

  function markDirty() {
    // 任何会影响知识库持久化结果的变更，都统一走这里挂脏并触发自动保存。
    isDirty.value = true
    saveError.value = ''

    if (isSaving.value) {
      queuedSave.value = true
      return
    }

    scheduleAutoSave()
  }

  async function saveCurrentKnowledgeBase(force = false) {
    // 保存同时覆盖手动点击和自动保存，不在页面层再拆两套逻辑。
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
      const knowledgeBase = await saveKnowledgeBase(options.knowledgeBaseId, {
        title: title.value,
        description: description.value,
        tags: tags.value,
        relatedDocumentIds: relatedDocumentIds.value,
        relatedKnowledgeBaseIds: [],
        visibility: visibility.value,
      })

      applyKnowledgeBaseState(knowledgeBase)
      isDirty.value = false
      options.onAfterSave?.()
    } catch {
      saveError.value = '保存失败，当前修改仍保留在本地。'
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

  function handleTitleInput(value: string) {
    titleDraft.value = value
    title.value = value
    options.onSyncTitle?.(value)
    markDirty()
  }

  function handleTitleBlur() {
    isTitleFocused.value = false
    syncTitleDraft(true)
  }

  function handleDescriptionChange(value: string) {
    description.value = value
    options.onSyncDescription?.(value)
    markDirty()
  }

  function handleTagsInput(value: string) {
    // 标签输入允许中英文逗号，便于不同输入法下快速录入。
    const nextTags = value
      .split(/[，,]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 12)

    if (arraysEqual(tags.value, nextTags)) {
      return
    }

    tags.value = nextTags
    options.onSyncTags?.(nextTags)
    markDirty()
  }

  function handleVisibilityChange(value: DocumentVisibility) {
    visibility.value = value
    options.onSyncVisibility?.(value)
    options.onAfterVisibilityChange?.()
    markDirty()
  }

  return {
    title,
    titleDraft,
    isTitleFocused,
    ownerName,
    description,
    tags,
    relatedDocumentIds,
    visibility,
    persistedVisibility,
    isSaving,
    isDirty,
    lastSavedAt,
    saveError,
    queuedSave,
    tagsInput,
    saveStatusLabel,
    syncTitleDraft,
    applyKnowledgeBaseState,
    hydrateKnowledgeBase,
    clearAutoSaveTimer,
    scheduleAutoSave,
    markDirty,
    saveCurrentKnowledgeBase,
    handleTitleInput,
    handleTitleBlur,
    handleDescriptionChange,
    handleTagsInput,
    handleVisibilityChange,
  }
}
