import { get, patch } from '@/request'
import type { DocumentCommentThread } from '@/types/comment'

export async function getDocumentCommentThreads(documentId: string): Promise<DocumentCommentThread[]> {
  return get<DocumentCommentThread[]>(`/documents/${documentId}/comment-threads`)
}

export async function updateDocumentCommentThreads(
  documentId: string,
  threads: DocumentCommentThread[],
): Promise<DocumentCommentThread[]> {
  return patch<DocumentCommentThread[]>(`/documents/${documentId}/comment-threads`, {
    threads,
  })
}
