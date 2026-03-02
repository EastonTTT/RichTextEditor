export type DocumentRole = 'owner' | 'collaborator'

export type DocumentVisibility = 'private' | 'shared'

export interface DocumentSummary {
  id: string
  title: string
  author: string
  lastModifiedAt: string
  preview: string
  visibility: DocumentVisibility
}

export interface DocumentDetail extends DocumentSummary {
  content: string
}

export interface CreateDocumentPayload {
  title?: string
  author: string
  content?: string
  visibility?: DocumentVisibility
}

export interface UpdateDocumentPayload {
  title?: string
  content?: string
  visibility?: DocumentVisibility
}
