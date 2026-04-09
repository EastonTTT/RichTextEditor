import type {
  CreateDocumentPayload,
  DocumentDetail,
  DocumentSummary,
  DuplicateDocumentPayload,
  RecentDocumentItem,
  UpdateDocumentPayload,
} from '@/types/document'
import type { UserProfile } from '@/types/user'

// 在浏览器存储中保留本地兜底的会话和文档数据。
const DOCUMENTS_KEY = 'rich-text-editor.documents'
const RECENT_DOCUMENTS_KEY = 'rich-text-editor.recent-documents'
const USER_KEY = 'rich-text-editor.user'
const TOKEN_KEY = 'token'

// 本地持久化主要服务于开发/离线演示场景，作为后端不可用时的兜底。
const now = () => new Date().toISOString()

function createId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function getDefaultUser(): UserProfile {
  return {
    id: 'guest',
    name: 'Guest',
    color: '#1677ff',
    nickname: 'Guest',
    avatar: '',
  }
}

function getDefaultDocument(author: string): DocumentDetail {
  // 首次进入系统时自动生成一篇欢迎文档，避免空列表体验过于生硬。
  const createdAt = now()
  const id = createId('doc')

  return {
    id,
    title: 'Untitled Document',
    author,
    ownerId: 'guest',
    ownerName: author,
    sharedWithUserIds: [],
    sharedWithUsers: [],
    lastModifiedAt: createdAt,
    preview: 'Start writing here...',
    visibility: 'private',
    roomName: `document:${id}`,
    content: '<h1>Welcome</h1><p>Start writing here...</p>',
  }
}

function safeParse<T>(value: string | null, fallback: T): T {
  // 本地存储容错解析，避免历史脏数据直接把应用启动打挂。
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
  // 对旧版本本地数据做一次补字段归一化，兼容后续结构演进。
  const documents = safeParse<DocumentDetail[]>(localStorage.getItem(DOCUMENTS_KEY), []).map((document) => ({
    ...document,
    ownerId: document.ownerId || 'guest',
    ownerName: document.ownerName || document.author || getStoredUser().name,
    sharedWithUserIds: Array.isArray(document.sharedWithUserIds) ? document.sharedWithUserIds : [],
    sharedWithUsers: Array.isArray(document.sharedWithUsers) ? document.sharedWithUsers : [],
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

export function setStoredSession(user: UserProfile, token: string): UserProfile {
  localStorage.setItem(USER_KEY, JSON.stringify(user))
  localStorage.setItem(TOKEN_KEY, token)
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
  // 列表页只依赖摘要字段，这里顺手按更新时间倒序整理好。
  return readDocuments()
    .slice()
    .sort((a, b) => new Date(b.lastModifiedAt).getTime() - new Date(a.lastModifiedAt).getTime())
    .map((document) => ({
      id: document.id,
      title: document.title,
      author: document.author,
      ownerId: document.ownerId,
      ownerName: document.ownerName,
      sharedWithUserIds: document.sharedWithUserIds,
      sharedWithUsers: document.sharedWithUsers,
      lastModifiedAt: document.lastModifiedAt,
      preview: document.preview,
      visibility: document.visibility,
      roomName: document.roomName,
      content: document.content,
    }))
}

export function getDocumentById(id: string): DocumentDetail | null {
  return readDocuments().find((document) => document.id === id) ?? null
}

export function listRecentDocuments(limit = 5): RecentDocumentItem[] {
  const items = safeParse<RecentDocumentItem[]>(localStorage.getItem(RECENT_DOCUMENTS_KEY), [])
  const documents = readDocuments()
  const documentMap = new Map(documents.map((document) => [document.id, document]))
  const filtered = items
    .map((item) => {
      const target = documentMap.get(item.id)
      if (!target) {
        return null
      }

      return {
        id: target.id,
        title: target.title,
        ownerId: target.ownerId,
        ownerName: target.ownerName,
        visibility: target.visibility,
      }
    })
    .filter((item): item is RecentDocumentItem => Boolean(item))
    .slice(0, limit)

  if (filtered.length !== items.length) {
    writeRecentDocuments(filtered)
  }

  return filtered
}

export function recordDocumentOpen(id: string) {
  // 最近访问列表去重后前插，保持“最近打开”的时间语义。
  const target = getDocumentById(id)
  if (!target) {
    return
  }

  const current = listRecentDocuments(20).filter((item) => item.id !== id)
  current.unshift({
    id: target.id,
    title: target.title,
    ownerId: target.ownerId,
    ownerName: target.ownerName,
    visibility: target.visibility,
  })
  writeRecentDocuments(current.slice(0, 10))
}

export function createDocument(payload: CreateDocumentPayload): DocumentDetail {
  // 新建文档时直接补齐 owner / roomName / preview 等派生字段。
  const documents = readDocuments()
  const createdAt = now()
  const id = createId('doc')

  const document: DocumentDetail = {
    id,
    title: payload.title?.trim() || 'Untitled Document',
    author: payload.author || getStoredUser().name,
    ownerId: getStoredUser().id,
    ownerName: getStoredUser().name,
    sharedWithUserIds: payload.sharedWithUserIds || [],
    sharedWithUsers: [],
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
    // preview 基于 HTML 的纯文本摘要生成，供首页和搜索列表展示。
    target.content = payload.content
    const plainText = payload.content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    target.preview = plainText.slice(0, 120) || 'Empty document'
  }

  if (payload.visibility) {
    target.visibility = payload.visibility
  }

  if (Array.isArray(payload.sharedWithUserIds)) {
    target.sharedWithUserIds = payload.sharedWithUserIds
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
  // 复制操作复用 createDocument，减少两套创建逻辑分叉。
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
    sharedWithUserIds: source.sharedWithUserIds,
  })
}
