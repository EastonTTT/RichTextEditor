// 封装文档、模板、版本和 AI 相关接口。
import type {
  CreateTemplatePayload,
  CreateDocumentPayload,
  DocumentDetail,
  DocumentSummary,
  DocumentTemplateSummary,
  DocumentVersion,
  DuplicateDocumentPayload,
  RecentDocumentItem,
  UpdateDocumentPayload,
} from '@/types/document'
import { del, get, patch, post } from '@/request'

// 文档相关接口比知识库更复杂，这里额外承接模板、版本和 AI 能力。
export async function getDocumentList(): Promise<DocumentSummary[]> {
  return get<DocumentSummary[]>('/documents')
}

export async function getDocumentDetail(id: string): Promise<DocumentDetail | null> {
  try {
    return await get<DocumentDetail>(`/documents/${id}`)
  } catch (error: any) {
    // 404 在编辑页里是一个明确分支，所以这里转成 null 交给页面层判断。
    const status = error?.response?.status
    const code = error?.code
    const message = typeof error?.msg === 'string' ? error.msg.toLowerCase() : ''

    if (status === 404 || code === 404 || message.includes('not found')) {
      return null
    }

    throw error
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
  // 导入文件走 FormData，兼容 doc/docx/pdf 等二进制内容上传。
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
  // AI 接口由服务端代理真实模型，前端只提交模式和问题即可。
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

export async function listDocumentVersions(id: string): Promise<DocumentVersion[]> {
  return get<DocumentVersion[]>(`/documents/${id}/versions`)
}

export async function createDocumentVersion(
  id: string,
  payload: {
    reason?: string
    summary?: string
  } = {},
): Promise<DocumentVersion> {
  // 快照与恢复都基于独立版本实体，便于后续扩展更多版本来源。
  return post<DocumentVersion>(`/documents/${id}/versions`, payload)
}

export async function getDocumentVersion(versionId: string): Promise<DocumentVersion> {
  return get<DocumentVersion>(`/document-versions/${versionId}`)
}

export async function restoreDocumentVersion(versionId: string): Promise<DocumentDetail> {
  return post<DocumentDetail>(`/document-versions/${versionId}/restore`)
}
