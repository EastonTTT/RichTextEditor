export type DocumentRole = 'owner' | 'collaborator'

export type DocumentVisibility = 'private' | 'shared'

export interface DocumentSummary {
  id: string
  title: string
  author: string
  lastModifiedAt: string
  preview: string
  visibility: DocumentVisibility
  roomName: string
}

export interface DocumentDetail extends DocumentSummary {
  content: string
}

export interface CreateDocumentPayload {
  title?: string
  author?: string
  content?: string
  visibility?: DocumentVisibility
}

export interface UpdateDocumentPayload {
  title?: string
  author?: string
  content?: string
  visibility?: DocumentVisibility
}

export interface DuplicateDocumentPayload {
  title?: string
  author?: string
}

export interface RecentDocumentItem {
  id: string
  title: string
}
