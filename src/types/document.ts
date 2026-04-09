// 声明应用内共享的文档、模板和版本类型。
import type { UserProfile } from './user'

// 文档支持所有者和协作者两种角色，目前主要用于语义表达。
export type DocumentRole = 'owner' | 'collaborator'

export type DocumentVisibility = 'private' | 'shared'

// 摘要结构覆盖列表页和详情页的公共字段。
export interface DocumentSummary {
  id: string
  title: string
  author: string
  ownerId: string
  ownerName: string
  sharedWithUserIds: string[]
  sharedWithUsers: UserProfile[]
  lastModifiedAt: string
  preview: string
  visibility: DocumentVisibility
  roomName: string
  content?: string
}

// 详情结构在摘要基础上强制要求完整 content。
export interface DocumentDetail extends DocumentSummary {
  content: string
}

export interface CreateDocumentPayload {
  title?: string
  author?: string
  content?: string
  visibility?: DocumentVisibility
  sharedWithUserIds?: string[]
}

// 更新文档时附带版本参数，用于保存和快照共用同一接口。
export interface UpdateDocumentPayload {
  title?: string
  author?: string
  content?: string
  visibility?: DocumentVisibility
  sharedWithUserIds?: string[]
  createVersion?: boolean
  versionReason?: string
  versionSummary?: string
}

export interface DuplicateDocumentPayload {
  title?: string
  author?: string
}

// 模板与版本类型让首页、编辑器和模板弹窗共享统一数据结构。
export interface DocumentTemplateSummary {
  id: string
  title: string
  description: string
  preview: string
  content: string
  sourceDocumentId: string | null
  ownerId: string
  ownerName: string
  createdAt: string
  updatedAt: string
}

export interface CreateTemplatePayload {
  title?: string
  description?: string
}

export interface RecentDocumentItem {
  id: string
  title: string
  ownerId: string
  ownerName: string
  visibility: DocumentVisibility
}

export interface DocumentVersion {
  id: string
  documentId: string
  versionNo: number
  title: string
  content: string
  reason: string
  summary: string
  createdById: string
  createdByName: string
  createdAt: string
}
