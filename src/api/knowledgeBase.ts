// 封装首页和归档页使用的知识库接口。
import { del, get, patch, post } from '@/request'
import type {
  CreateKnowledgeBasePayload,
  DuplicateKnowledgeBasePayload,
  KnowledgeBaseDetail,
  KnowledgeBaseSummary,
  RecentKnowledgeBaseItem,
  UpdateKnowledgeBasePayload,
} from '@/types/knowledgeBase'

// 知识库接口统一收敛在这里，页面层只关心业务动作而不关心请求细节。
export async function getKnowledgeBaseList(): Promise<KnowledgeBaseSummary[]> {
  return get<KnowledgeBaseSummary[]>('/knowledge-bases')
}

export async function getKnowledgeBaseDetail(id: string): Promise<KnowledgeBaseDetail | null> {
  try {
    return await get<KnowledgeBaseDetail>(`/knowledge-bases/${id}`)
  } catch {
    // 详情页把“未找到”视为可恢复状态，由上层决定跳转 404 或其他兜底。
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
  // 最近访问记录由后端维护，前端只需在打开时触发一次登记。
  await post(`/knowledge-bases/${id}/open`)
}
