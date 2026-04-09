// 声明 IndexedDB 草稿记录及其同步生命周期状态。
import type { DocumentVisibility } from './document'

// 离线草稿的状态机会驱动顶部状态标签和恢复弹窗。
export type OfflineDraftSyncState = 'synced' | 'pending' | 'syncing' | 'conflict'

// 草稿快照保存的是“可完整恢复编辑上下文”的最小信息集。
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
