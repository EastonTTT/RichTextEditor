import type {
  CreateDocumentPayload,
  DocumentDetail,
  DocumentSummary,
  DuplicateDocumentPayload,
  RecentDocumentItem,
  UpdateDocumentPayload,
} from '@/types/document'
import type { UserProfile } from '@/types/user'

const DOCUMENTS_KEY = 'rich-text-editor.documents'
const RECENT_DOCUMENTS_KEY = 'rich-text-editor.recent-documents'
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
  const id = createId('doc')

  return {
    id,
    title: 'Untitled Document',
    author,
    lastModifiedAt: createdAt,
    preview: 'Start writing here...',
    visibility: 'private',
    roomName: `document:${id}`,
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
  const documents = safeParse<DocumentDetail[]>(localStorage.getItem(DOCUMENTS_KEY), []).map((document) => ({
    ...document,
    roomName: document.roomName || `document:${document.id}`,
  }))

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

function writeRecentDocuments(items: RecentDocumentItem[]) {
  localStorage.setItem(RECENT_DOCUMENTS_KEY, JSON.stringify(items))
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
    .map((document) => ({
      id: document.id,
      title: document.title,
      author: document.author,
      lastModifiedAt: document.lastModifiedAt,
      preview: document.preview,
      visibility: document.visibility,
      roomName: document.roomName,
    }))
}

export function getDocumentById(id: string): DocumentDetail | null {
  return readDocuments().find((document) => document.id === id) ?? null
}

export function listRecentDocuments(limit = 5): RecentDocumentItem[] {
  const items = safeParse<RecentDocumentItem[]>(localStorage.getItem(RECENT_DOCUMENTS_KEY), [])
  const validIds = new Set(readDocuments().map((document) => document.id))
  const filtered = items.filter((item) => validIds.has(item.id)).slice(0, limit)

  if (filtered.length !== items.length) {
    writeRecentDocuments(filtered)
  }

  return filtered
}

export function recordDocumentOpen(id: string) {
  const target = getDocumentById(id)
  if (!target) {
    return
  }

  const current = listRecentDocuments(20).filter((item) => item.id !== id)
  current.unshift({
    id: target.id,
    title: target.title,
  })
  writeRecentDocuments(current.slice(0, 10))
}

export function createDocument(payload: CreateDocumentPayload): DocumentDetail {
  const documents = readDocuments()
  const createdAt = now()
  const id = createId('doc')

  const document: DocumentDetail = {
    id,
    title: payload.title?.trim() || 'Untitled Document',
    author: payload.author || getStoredUser().name,
    lastModifiedAt: createdAt,
    preview: 'New document',
    visibility: payload.visibility ?? 'private',
    roomName: `document:${id}`,
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
  writeRecentDocuments(
    listRecentDocuments(20).map((item) =>
      item.id === id
        ? {
            ...item,
            title: target.title,
          }
        : item,
    ),
  )
  return target
}

export function deleteDocument(id: string) {
  const documents = readDocuments().filter((document) => document.id !== id)
  writeDocuments(documents)
  writeRecentDocuments(listRecentDocuments(20).filter((item) => item.id !== id))
}

export function duplicateDocument(id: string, payload: DuplicateDocumentPayload = {}): DocumentDetail {
  const source = getDocumentById(id)

  if (!source) {
    throw new Error('Document not found')
  }

  const duplicateTitle = payload.title?.trim() || `${source.title} Copy`

  return createDocument({
    author: source.author,
    title: duplicateTitle,
    content: source.content,
    visibility: source.visibility,
  })
}
