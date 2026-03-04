import { del, get, patch, post } from '@/request'
import type {
  CreateKnowledgeBasePayload,
  DuplicateKnowledgeBasePayload,
  KnowledgeBaseDetail,
  KnowledgeBaseSummary,
  RecentKnowledgeBaseItem,
  UpdateKnowledgeBasePayload,
} from '@/types/knowledgeBase'

export async function getKnowledgeBaseList(): Promise<KnowledgeBaseSummary[]> {
  return get<KnowledgeBaseSummary[]>('/knowledge-bases')
}

export async function getKnowledgeBaseDetail(id: string): Promise<KnowledgeBaseDetail | null> {
  try {
    return await get<KnowledgeBaseDetail>(`/knowledge-bases/${id}`)
  } catch {
    return null
  }
}

export async function createKnowledgeBase(payload: CreateKnowledgeBasePayload): Promise<KnowledgeBaseDetail> {
  return post<KnowledgeBaseDetail>('/knowledge-bases', payload)
}

export async function saveKnowledgeBase(id: string, payload: UpdateKnowledgeBasePayload): Promise<KnowledgeBaseDetail> {
  return patch<KnowledgeBaseDetail>(`/knowledge-bases/${id}`, payload)
}

export async function removeKnowledgeBase(id: string): Promise<void> {
  await del(`/knowledge-bases/${id}`)
}

export async function duplicateKnowledgeBase(
  id: string,
  payload: DuplicateKnowledgeBasePayload = {},
): Promise<KnowledgeBaseDetail> {
  return post<KnowledgeBaseDetail>(`/knowledge-bases/${id}/duplicate`, payload)
}

export async function getRecentKnowledgeBases(limit = 5): Promise<RecentKnowledgeBaseItem[]> {
  return get<RecentKnowledgeBaseItem[]>('/knowledge-bases/recent', { limit })
}

export async function recordKnowledgeBaseOpen(id: string): Promise<void> {
  await post(`/knowledge-bases/${id}/open`)
}
