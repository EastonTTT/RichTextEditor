// 声明应用内共享的文档、模板和版本类型。
import type { UserProfile } from './user'

export type DocumentRole = 'owner' | 'collaborator'

export type DocumentVisibility = 'private' | 'shared'

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
