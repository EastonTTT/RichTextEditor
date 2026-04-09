// 加载文档版本列表，并提供恢复和预览能力。
import { ElMessage, ElMessageBox } from 'element-plus'
import { nextTick, ref, type Ref } from 'vue'
import type { Editor as CoreEditor } from '@tiptap/core'
import {
  createDocumentVersion,
  getDocumentVersion,
  listDocumentVersions,
  restoreDocumentVersion,
  saveDocument,
} from '@/api/document'
import type { DocumentDetail, DocumentVersion, DocumentVisibility } from '@/types/document'
import { buildBlockDiff, type DiffRow } from './useVersionPresentation'

interface UseDocumentVersionsOptions {
  documentId: string
  title: Ref<string>
  visibility: Ref<DocumentVisibility>
  shareTargetIds: Ref<string[]>
  isOwner: Ref<boolean>
  persistedVisibility: Ref<DocumentVisibility>
  latestContentSnapshot: Ref<string>
  editorInstance: Ref<CoreEditor | null>
  isDirty: Ref<boolean>
  isHydrating: Ref<boolean>
  applyDocumentState: (document: DocumentDetail) => void
  persistOfflineBaseline: (document: DocumentDetail) => Promise<void>
  rebuildEditorSession: (document: DocumentDetail) => Promise<void>
  syncEditorStats: (editor: CoreEditor | null) => void
  refreshSearchMatches: (editor: CoreEditor | null) => void
  getErrorMessage: (error: unknown, fallback: string) => string
}

export function useDocumentVersions(options: UseDocumentVersionsOptions) {
  // 历史版本的查看、快照和恢复都收敛到这里，页面层只负责展示抽屉和弹窗。
  const isVersionsOpen = ref(false)
  const isVersionPreviewOpen = ref(false)
  const versions = ref<DocumentVersion[]>([])
  const selectedVersionPreview = ref<DocumentVersion | null>(null)
  const isVersionsLoading = ref(false)
  const isVersionActionRunning = ref(false)
  const diffRows = ref<DiffRow[]>([])
  const diffTruncated = ref(false)
  const diffStats = ref({
    added: 0,
    removed: 0,
    changed: 0,
  })

  async function loadVersions() {
    isVersionsLoading.value = true
    try {
      versions.value = await listDocumentVersions(options.documentId)
    } catch (error) {
      ElMessage.error(options.getErrorMessage(error, '历史版本加载失败'))
    } finally {
      isVersionsLoading.value = false
    }
  }

  async function openVersionDrawer() {
    isVersionsOpen.value = true
    await loadVersions()
  }

  async function previewVersion(versionId: string) {
    try {
      // 预览时同时计算块级差异，给 UI 提供更容易阅读的结构化结果。
      selectedVersionPreview.value = await getDocumentVersion(versionId)
      const diffResult = buildBlockDiff(
        options.latestContentSnapshot.value || '<p></p>',
        selectedVersionPreview.value.content || '<p></p>',
      )
      diffRows.value = diffResult.rows
      diffStats.value = diffResult.stats
      diffTruncated.value = diffResult.truncated
      isVersionPreviewOpen.value = true
    } catch (error) {
      ElMessage.error(options.getErrorMessage(error, '版本预览加载失败'))
    }
  }

  async function handleCreateSnapshot() {
    // 创建快照前先同步一次最新正文，避免版本内容落后于当前编辑器。
    const currentEditor = options.editorInstance.value
    if (!currentEditor) {
      return
    }

    isVersionActionRunning.value = true
    try {
      const syncedDocument = await saveDocument(options.documentId, {
        title: options.title.value.trim() || '未命名文档',
        content: currentEditor.getHTML(),
        visibility: options.visibility.value,
        sharedWithUserIds:
          options.isOwner.value && options.visibility.value === 'shared' ? options.shareTargetIds.value : [],
        createVersion: false,
        versionReason: 'manual_snapshot_prepare',
        versionSummary: 'Sync latest editor content before snapshot',
      })

      options.applyDocumentState(syncedDocument)
      options.isDirty.value = false
      await options.persistOfflineBaseline(syncedDocument)

      await createDocumentVersion(options.documentId, {
        reason: 'manual_snapshot',
        summary: `Snapshot created from ${options.title.value}`,
      })
      await loadVersions()
      ElMessage.success('历史版本已创建')
    } catch (error) {
      ElMessage.error(options.getErrorMessage(error, '创建快照失败'))
    } finally {
      isVersionActionRunning.value = false
    }
  }

  async function handleRestoreVersion(versionId: string) {
    try {
      await ElMessageBox.confirm(
        '恢复版本会覆盖当前文档内容，系统会先自动备份当前状态。是否继续？',
        '恢复历史版本',
        {
          confirmButtonText: '恢复',
          cancelButtonText: '取消',
          type: 'warning',
        },
      )
    } catch {
      return
    }

    isVersionActionRunning.value = true
    try {
      // 恢复版本后，如果文档模式发生变化，需要整个编辑器会话一起重建。
      const previousPersistedVisibility = options.persistedVisibility.value
      const document = await restoreDocumentVersion(versionId)
      options.applyDocumentState(document)
      options.isDirty.value = false
      isVersionPreviewOpen.value = false
      await options.persistOfflineBaseline(document)

      if (previousPersistedVisibility !== document.visibility) {
        await options.rebuildEditorSession(document)
      } else if (options.editorInstance.value) {
        options.isHydrating.value = true
        options.editorInstance.value.commands.setContent(document.content || '<p></p>', false)
        await nextTick()
        options.isHydrating.value = false
      }

      options.syncEditorStats(options.editorInstance.value ?? null)
      options.refreshSearchMatches(options.editorInstance.value ?? null)
      await loadVersions()
      ElMessage.success('历史版本恢复成功')
    } catch (error) {
      ElMessage.error(options.getErrorMessage(error, '恢复历史版本失败'))
    } finally {
      isVersionActionRunning.value = false
    }
  }

  return {
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
  }
}
