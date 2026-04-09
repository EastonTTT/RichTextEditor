// 将离线编辑草稿持久化到 IndexedDB，用于断线恢复。
import type { OfflineDraftRecord, OfflineDraftSyncState } from '@/types/offline'

const DB_NAME = 'rich-text-editor-offline'
const STORE_NAME = 'document-drafts'
const DB_VERSION = 1

// 复用同一个打开中的数据库连接，避免频繁创建 IndexedDB 句柄。
let openPromise: Promise<IDBDatabase> | null = null

function openDatabase() {
  if (typeof window === 'undefined' || typeof window.indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable'))
  }

  if (!openPromise) {
    openPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION)

      request.onerror = () => {
        reject(request.error || new Error('Failed to open IndexedDB'))
      }

      request.onupgradeneeded = () => {
        const database = request.result
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          database.createObjectStore(STORE_NAME, {
            keyPath: 'documentId',
          })
        }
      }

      request.onsuccess = () => {
        const database = request.result
        database.onclose = () => {
          openPromise = null
        }
        resolve(database)
      }
    })
  }

  return openPromise
}

async function withStore<T>(mode: IDBTransactionMode, runner: (store: IDBObjectStore) => Promise<T> | T) {
  // 统一封装事务生命周期，让上层只关注具体的 store 操作。
  const database = await openDatabase()

  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)

    Promise.resolve(runner(store))
      .then((value) => {
        transaction.oncomplete = () => resolve(value)
        transaction.onerror = () => reject(transaction.error || new Error('IndexedDB transaction failed'))
        transaction.onabort = () => reject(transaction.error || new Error('IndexedDB transaction aborted'))
      })
      .catch((error) => {
        reject(error)
      })
  })
}

function requestToPromise<T>(request: IDBRequest<T>) {
  return new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error || new Error('IndexedDB request failed'))
  })
}

export async function getOfflineDraft(documentId: string) {
  // 每篇文档只保留一份草稿快照，主键直接使用 documentId。
  return withStore<OfflineDraftRecord | null>('readonly', async (store) => {
    const result = await requestToPromise(store.get(documentId) as IDBRequest<OfflineDraftRecord | undefined>)
    return result || null
  })
}

export async function saveOfflineDraft(record: OfflineDraftRecord) {
  await withStore<void>('readwrite', async (store) => {
    await requestToPromise(store.put(record))
  })
}

export async function updateOfflineDraftSyncState(documentId: string, syncState: OfflineDraftSyncState) {
  const existing = await getOfflineDraft(documentId)
  if (!existing) {
    return
  }

  await saveOfflineDraft({
    ...existing,
    syncState,
  })
}

export async function removeOfflineDraft(documentId: string) {
  await withStore<void>('readwrite', async (store) => {
    await requestToPromise(store.delete(documentId))
  })
}
