// 声明 IndexedDB 草稿记录及其同步生命周期状态。
import type { DocumentVisibility } from './document'

export type OfflineDraftSyncState = 'synced' | 'pending' | 'syncing' | 'conflict'

export interface OfflineDraftRecord {
  documentId: string
  title: string
  content: string
  visibility: DocumentVisibility
  sharedWithUserIds: string[]
  updatedAt: string
  lastServerUpdatedAt: string
  syncState: OfflineDraftSyncState
}
