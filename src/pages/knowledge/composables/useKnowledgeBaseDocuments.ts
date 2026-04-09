// 加载文档选项，并管理知识库中的归档归属关系。
import * as Y from 'yjs'
import { computed, ref, type Ref } from 'vue'
import { getDocumentList } from '@/api/document'
import { setMetaValueIfChanged } from '@/utils/collaborationMeta'
import type { DocumentSummary } from '@/types/document'

interface UseKnowledgeBaseDocumentsOptions {
  relatedDocumentIds: Ref<string[]>
  markDirty: () => void
  metaMap?: Ref<Y.Map<unknown> | null>
  hasReceivedInitialSync?: Ref<boolean>
}

export function useKnowledgeBaseDocuments(options: UseKnowledgeBaseDocumentsOptions) {
  // 这里专管“可归档文档池”和“已归档文档列表”的切换逻辑。
  const documentOptions = ref<DocumentSummary[]>([])
  const documentSearch = ref('')

  const selectedDocuments = computed(() =>
    documentOptions.value.filter((document) => options.relatedDocumentIds.value.includes(document.id)),
  )

  const availableDocuments = computed(() => {
    // 文档选择器只做前端过滤，不额外走搜索接口，保持交互即时。
    const normalizedKeyword = documentSearch.value.trim().toLowerCase()
    return documentOptions.value.filter((document) => {
      if (normalizedKeyword.length === 0) {
        return true
      }

      return (
        document.title.toLowerCase().includes(normalizedKeyword) ||
        document.preview.toLowerCase().includes(normalizedKeyword) ||
        document.ownerName.toLowerCase().includes(normalizedKeyword) ||
        (document.content || '').toLowerCase().includes(normalizedKeyword)
      )
    })
  })

  async function loadReferenceOptions() {
    documentOptions.value = await getDocumentList()
  }

  function syncRelatedDocumentIds(nextValue: string[]) {
    // 如果当前已经进入协同同步阶段，需要把关联文档列表同步到 meta。
    const meta = options.metaMap?.value
    const synced = options.hasReceivedInitialSync?.value
    if (meta && synced) {
      setMetaValueIfChanged(meta, 'relatedDocumentIds', nextValue)
    }
  }

  function toggleArchivedDocument(id: string) {
    // 同一个入口同时支持“加入知识库”和“从知识库移除”。
    const nextValue = options.relatedDocumentIds.value.includes(id)
      ? options.relatedDocumentIds.value.filter((documentId) => documentId !== id)
      : [...options.relatedDocumentIds.value, id]

    options.relatedDocumentIds.value = nextValue
    syncRelatedDocumentIds(nextValue)
    options.markDirty()
  }

  function removeArchivedDocument(id: string) {
    if (!options.relatedDocumentIds.value.includes(id)) {
      return
    }

    const nextValue = options.relatedDocumentIds.value.filter((documentId) => documentId !== id)
    options.relatedDocumentIds.value = nextValue
    syncRelatedDocumentIds(nextValue)
    options.markDirty()
  }

  return {
    documentOptions,
    documentSearch,
    selectedDocuments,
    availableDocuments,
    loadReferenceOptions,
    toggleArchivedDocument,
    removeArchivedDocument,
  }
}
