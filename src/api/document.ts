import type {
  CreateTemplatePayload,
  CreateDocumentPayload,
  DocumentDetail,
  DocumentSummary,
  DocumentTemplateSummary,
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

export async function importDocument(file: File, title?: string): Promise<DocumentDetail> {
  const formData = new FormData()
  formData.append('file', file)
  if (title?.trim()) {
    formData.append('title', title.trim())
  }
  return post<DocumentDetail>('/documents/import', formData)
}

export async function askDocumentAi(
  id: string,
  payload: {
    mode: 'summary' | 'question'
    prompt?: string
  },
): Promise<{ answer: string }> {
  return post<{ answer: string }>(`/documents/${id}/ai`, payload)
}

export async function getDocumentTemplates(): Promise<DocumentTemplateSummary[]> {
  return get<DocumentTemplateSummary[]>('/document-templates')
}

export async function saveDocumentAsTemplate(
  id: string,
  payload: CreateTemplatePayload = {},
): Promise<DocumentTemplateSummary> {
  return post<DocumentTemplateSummary>(`/documents/${id}/template`, payload)
}

export async function createDocumentFromTemplate(
  templateId: string,
  payload: { title?: string; author?: string } = {},
): Promise<DocumentDetail> {
  return post<DocumentDetail>(`/document-templates/${templateId}/create-document`, payload)
}

export async function removeDocumentTemplate(templateId: string): Promise<void> {
  await del(`/document-templates/${templateId}`)
}
