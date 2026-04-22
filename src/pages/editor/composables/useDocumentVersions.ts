// 加载文档历史版本，并提供预览、快照、恢复和删除能力。
import { ElMessage, ElMessageBox } from 'element-plus'
import { nextTick, ref, type Ref } from 'vue'
import type { Editor as CoreEditor } from '@tiptap/core'
import {
  createDocumentVersion,
  deleteDocumentVersion,
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
  // 页面层只负责展示抽屉和弹窗，版本相关的读写流程统一收口在这里。
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
      // 预览时同时计算块级差异，给 UI 提供更易读的结构化对比结果。
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

    let versionSummary = ''
    try {
      const { value } = await ElMessageBox.prompt('请填写这次历史版本的描述，方便后续识别版本用途。', '创建快照', {
        inputPlaceholder: '例如：补充了接口设计说明，准备提交评审',
        inputPattern: /\S+/,
        inputErrorMessage: '描述不能为空。',
        confirmButtonText: '创建',
        cancelButtonText: '取消',
      })
      versionSummary = value.trim()
    } catch {
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
        summary: versionSummary,
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
    // 恢复前允许用户决定是否把当前编辑中的内容留作备份，避免默认制造冗余版本。
    const currentEditor = options.editorInstance.value
    if (!currentEditor) {
      return
    }

    const targetVersion = versions.value.find((version) => version.id === versionId)
    let shouldCreateBackup = true

    try {
      await ElMessageBox.confirm(
        `恢复到${targetVersion ? ` v${targetVersion.versionNo}` : '该历史版本'}会覆盖当前编辑内容。你可以先将当前内容存为恢复前备份，或直接恢复。`,
        '恢复历史版本',
        {
          confirmButtonText: '保存备份并恢复',
          cancelButtonText: '直接恢复',
          distinguishCancelAndClose: true,
          closeOnClickModal: false,
          closeOnPressEscape: false,
          type: 'warning',
        },
      )
    } catch (action) {
      if (action === 'cancel') {
        shouldCreateBackup = false
      } else {
        return
      }
    }

    isVersionActionRunning.value = true
    try {
      const previousPersistedVisibility = options.persistedVisibility.value
      const document = await restoreDocumentVersion(versionId, {
        createBackup: shouldCreateBackup,
        currentTitle: options.title.value.trim() || '未命名文档',
        currentContent: currentEditor.getHTML(),
        backupSummary: targetVersion ? `Backup before restoring version v${targetVersion.versionNo}` : 'Backup before restoring version',
      })

      options.applyDocumentState(document)
      options.isDirty.value = false
      isVersionPreviewOpen.value = false
      await options.persistOfflineBaseline(document)

      if (previousPersistedVisibility !== document.visibility) {
        await options.rebuildEditorSession(document)
      } else {
        options.isHydrating.value = true
        currentEditor.commands.setContent(document.content || '<p></p>', false)
        await nextTick()
        options.isHydrating.value = false
      }

      options.syncEditorStats(options.editorInstance.value ?? currentEditor)
      options.refreshSearchMatches(options.editorInstance.value ?? currentEditor)
      await loadVersions()
      ElMessage.success('历史版本恢复成功')
    } catch (error) {
      ElMessage.error(options.getErrorMessage(error, '恢复历史版本失败'))
    } finally {
      isVersionActionRunning.value = false
    }
  }

  async function handleDeleteVersion(versionId: string) {
    try {
      await ElMessageBox.confirm('删除后将无法再预览或恢复这个历史版本，是否继续？', '删除历史版本', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      })
    } catch {
      return
    }

    isVersionActionRunning.value = true
    try {
      await deleteDocumentVersion(versionId)

      if (selectedVersionPreview.value?.id === versionId) {
        selectedVersionPreview.value = null
        diffRows.value = []
        diffTruncated.value = false
        diffStats.value = {
          added: 0,
          removed: 0,
          changed: 0,
        }
        isVersionPreviewOpen.value = false
      }

      await loadVersions()
      ElMessage.success('历史版本已删除')
    } catch (error) {
      ElMessage.error(options.getErrorMessage(error, '删除历史版本失败'))
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
    handleDeleteVersion,
  }
}
