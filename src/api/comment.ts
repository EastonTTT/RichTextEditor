// 封装编辑器评论线程相关接口。
import { del, get, patch } from '@/request'
import type { DocumentCommentThread } from '@/types/comment'

// 评论目前以 thread 数组整体存取，方便实现简单的文档讨论区。
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

export async function deleteDocumentComment(
  documentId: string,
  threadId: string,
  commentId: string,
): Promise<DocumentCommentThread[]> {
  return del<DocumentCommentThread[]>(`/documents/${documentId}/comment-threads/${threadId}/comments/${commentId}`)
}
