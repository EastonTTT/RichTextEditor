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
