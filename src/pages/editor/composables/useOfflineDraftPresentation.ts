// 将离线草稿同步状态映射为面向用户的标签和提示文案。
import { computed, type Ref } from 'vue'
import type { OfflineDraftSyncState } from '@/types/offline'

export function useOfflineDraftPresentation(
  networkState: Ref<'online' | 'offline'>,
  draftSyncState: Ref<OfflineDraftSyncState>,
) {
  const offlineSyncStateLabel = computed(() => {
    if (draftSyncState.value === 'conflict') {
      return '存在冲突'
    }

    if (networkState.value === 'offline') {
      return '离线暂存'
    }

    if (draftSyncState.value === 'syncing') {
      return '同步中'
    }

    if (draftSyncState.value === 'pending') {
      return '等待同步'
    }

    return '已同步'
  })

  const offlineStatusTitle = computed(() => {
    if (draftSyncState.value === 'conflict') {
      return '检测到同步冲突'
    }

    if (networkState.value === 'offline') {
      return '当前正在离线编辑'
    }

    if (draftSyncState.value === 'pending') {
      return '本地草稿等待同步'
    }

    if (draftSyncState.value === 'syncing') {
      return '本地草稿同步中'
    }

    return '本地草稿与服务器一致'
  })

  const offlineStatusDescription = computed(() => {
    if (draftSyncState.value === 'conflict') {
      return '服务器内容和本地草稿在断线期间都发生了变化，请选择覆盖、保留或生成冲突副本。'
    }

    if (networkState.value === 'offline') {
      return '当前修改会优先写入浏览器本地草稿，恢复网络后可自动回传服务器。'
    }

    if (draftSyncState.value === 'pending') {
      return '文档已有本地修改尚未推送到服务器，可以手动触发同步。'
    }

    if (draftSyncState.value === 'syncing') {
      return '系统正在检查服务器基线并回传本地草稿。'
    }

    return '当前没有待处理的本地离线修改。'
  })

  return {
    offlineSyncStateLabel,
    offlineStatusTitle,
    offlineStatusDescription,
  }
}
