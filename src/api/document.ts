import type {
  CreateDocumentPayload,
  DocumentDetail,
  DocumentSummary,
  DuplicateDocumentPayload,
  RecentDocumentItem,
  UpdateDocumentPayload,
} from '@/types/document'
import { del, get, patch, post } from '@/request'

export async function getDocumentList(): Promise<DocumentSummary[]> {
  return get<DocumentSummary[]>('/documents')
}

export async function getDocumentDetail(id: string): Promise<DocumentDetail | null> {
  try {
    return await get<DocumentDetail>(`/documents/${id}`)
  } catch {
    return null
  }
}

export async function createDocument(payload: CreateDocumentPayload): Promise<DocumentDetail> {
  return post<DocumentDetail>('/documents', payload)
}

export async function saveDocument(id: string, payload: UpdateDocumentPayload): Promise<DocumentDetail> {
  return patch<DocumentDetail>(`/documents/${id}`, payload)
}

export async function removeDocument(id: string): Promise<void> {
  await del(`/documents/${id}`)
}

export async function duplicateDocument(id: string, payload: DuplicateDocumentPayload = {}): Promise<DocumentDetail> {
  return post<DocumentDetail>(`/documents/${id}/duplicate`, payload)
}

export async function getRecentDocuments(limit = 5): Promise<RecentDocumentItem[]> {
  return get<RecentDocumentItem[]>('/documents/recent', { limit })
}

export async function recordDocumentOpen(id: string): Promise<void> {
  await post(`/documents/${id}/open`)
}
