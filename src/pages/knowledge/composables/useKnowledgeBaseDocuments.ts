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
  const documentOptions = ref<DocumentSummary[]>([])
  const documentSearch = ref('')

  const selectedDocuments = computed(() =>
    documentOptions.value.filter((document) => options.relatedDocumentIds.value.includes(document.id)),
  )

  const availableDocuments = computed(() => {
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
    const meta = options.metaMap?.value
    const synced = options.hasReceivedInitialSync?.value
    if (meta && synced) {
      setMetaValueIfChanged(meta, 'relatedDocumentIds', nextValue)
    }
  }

  function toggleArchivedDocument(id: string) {
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
