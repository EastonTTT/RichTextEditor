import type {
  CreateDocumentPayload,
  DocumentDetail,
  DocumentSummary,
  UpdateDocumentPayload,
} from '@/types/document'
import type { UserProfile } from '@/types/user'

const DOCUMENTS_KEY = 'rich-text-editor.documents'
const USER_KEY = 'rich-text-editor.user'
const TOKEN_KEY = 'token'

const now = () => new Date().toISOString()

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getDefaultUser(): UserProfile {
  return {
    id: 'guest',
    name: 'Guest',
    color: '#1677ff',
  }
}

function getDefaultDocument(author: string): DocumentDetail {
  const createdAt = now()

  return {
    id: createId('doc'),
    title: 'Untitled Document',
    author,
    lastModifiedAt: createdAt,
    preview: 'Start writing here...',
    visibility: 'private',
    content: '<h1>Welcome</h1><p>Start writing here...</p>',
  }
}

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback
  }

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function readDocuments(): DocumentDetail[] {
  const documents = safeParse<DocumentDetail[]>(localStorage.getItem(DOCUMENTS_KEY), [])

  if (documents.length > 0) {
    return documents
  }

  const user = getStoredUser().name
  const seed = [getDefaultDocument(user)]
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(seed))
  return seed
}

function writeDocuments(documents: DocumentDetail[]) {
  localStorage.setItem(DOCUMENTS_KEY, JSON.stringify(documents))
}

export function getStoredUser(): UserProfile {
  return safeParse<UserProfile>(localStorage.getItem(USER_KEY), getDefaultUser())
}

export function setStoredUser(name: string): UserProfile {
  const user: UserProfile = {
    id: createId('user'),
    name: name.trim(),
    color: '#1677ff',
  }

  localStorage.setItem(USER_KEY, JSON.stringify(user))
  localStorage.setItem(TOKEN_KEY, `local-${user.id}`)
  return user
}

export function clearStoredUser() {
  localStorage.removeItem(USER_KEY)
  localStorage.removeItem(TOKEN_KEY)
}

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function listDocuments(): DocumentSummary[] {
  return readDocuments()
    .slice()
    .sort((a, b) => new Date(b.lastModifiedAt).getTime() - new Date(a.lastModifiedAt).getTime())
    .map(({ content, ...summary }) => summary)
}

export function getDocumentById(id: string): DocumentDetail | null {
  return readDocuments().find((document) => document.id === id) ?? null
}

export function createDocument(payload: CreateDocumentPayload): DocumentDetail {
  const documents = readDocuments()
  const createdAt = now()

  const document: DocumentDetail = {
    id: createId('doc'),
    title: payload.title?.trim() || 'Untitled Document',
    author: payload.author,
    lastModifiedAt: createdAt,
    preview: 'New document',
    visibility: payload.visibility ?? 'private',
    content: payload.content || '<p></p>',
  }

  documents.unshift(document)
  writeDocuments(documents)
  return document
}

export function updateDocument(id: string, payload: UpdateDocumentPayload): DocumentDetail {
  const documents = readDocuments()
  const target = documents.find((document) => document.id === id)

  if (!target) {
    throw new Error('Document not found')
  }

  if (typeof payload.title === 'string') {
    target.title = payload.title.trim() || target.title
  }

  if (typeof payload.content === 'string') {
    target.content = payload.content
    const plainText = payload.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    target.preview = plainText.slice(0, 120) || 'Empty document'
  }

  if (payload.visibility) {
    target.visibility = payload.visibility
  }

  target.lastModifiedAt = now()
  writeDocuments(documents)
  return target
}

export function deleteDocument(id: string) {
  const documents = readDocuments().filter((document) => document.id !== id)
  writeDocuments(documents)
}
