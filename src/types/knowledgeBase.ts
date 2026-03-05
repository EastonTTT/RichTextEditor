import type { DocumentVisibility } from './document'

export interface KnowledgeBaseSummary {
  id: string
  title: string
  author: string
  ownerId: string
  ownerName: string
  description: string
  tags: string[]
  relatedDocumentIds: string[]
  relatedKnowledgeBaseIds: string[]
  lastModifiedAt: string
  preview: string
  visibility: DocumentVisibility
  roomName: string
  content?: string
}

export interface KnowledgeBaseDetail extends KnowledgeBaseSummary {
  content: string
}

export interface CreateKnowledgeBasePayload {
  title?: string
  author?: string
  description?: string
  tags?: string[]
  relatedDocumentIds?: string[]
  relatedKnowledgeBaseIds?: string[]
  content?: string
  visibility?: DocumentVisibility
}

export interface UpdateKnowledgeBasePayload {
  title?: string
  author?: string
  description?: string
  tags?: string[]
  relatedDocumentIds?: string[]
  relatedKnowledgeBaseIds?: string[]
  content?: string
  visibility?: DocumentVisibility
}

export interface DuplicateKnowledgeBasePayload {
  title?: string
  author?: string
  description?: string
  tags?: string[]
  relatedDocumentIds?: string[]
  relatedKnowledgeBaseIds?: string[]
}

export interface RecentKnowledgeBaseItem {
  id: string
  title: string
  ownerId: string
  ownerName: string
  visibility: DocumentVisibility
}
