<template>
  <el-drawer v-model="drawerVisible" title="离线草稿与恢复" size="420px">
    <div class="offline-center">
      <div class="offline-status-card" :class="`offline-status-card--${draftSyncState}`">
        <div class="offline-status-title">{{ offlineStatusTitle }}</div>
        <div class="offline-status-desc">{{ offlineStatusDescription }}</div>
      </div>

      <div class="offline-center-grid">
        <div class="offline-metric">
          <span class="offline-metric-label">网络状态</span>
          <strong>{{ networkState === 'offline' ? '已断开' : '正常' }}</strong>
        </div>
        <div class="offline-metric">
          <span class="offline-metric-label">同步状态</span>
          <strong>{{ offlineSyncStateLabel }}</strong>
        </div>
        <div class="offline-metric">
          <span class="offline-metric-label">本地草稿时间</span>
          <strong>{{ offlineDraftUpdatedAt }}</strong>
        </div>
        <div class="offline-metric">
          <span class="offline-metric-label">服务器基线</span>
          <strong>{{ serverBaselineTime }}</strong>
        </div>
      </div>

      <div class="offline-center-actions">
        <el-button
          v-if="networkState === 'online' && (draftSyncState === 'pending' || draftSyncState === 'conflict')"
          type="primary"
          :loading="isSyncingOfflineDraft"
          @click="emit('sync')"
        >
          立即同步
        </el-button>
        <el-button v-if="draftSyncState === 'conflict'" @click="emit('openConflict')">处理冲突</el-button>
        <el-button v-if="hasOfflineDraft && draftSyncState !== 'synced'" @click="emit('restoreDraft')">恢复到编辑器</el-button>
        <el-button v-if="hasOfflineDraft" @click="emit('clearDraft')">清理本地草稿</el-button>
      </div>

      <div class="offline-center-note">
        <div class="offline-section-title">说明</div>
        <p>离线时系统会把当前标题、正文、可见性和共享对象写入本地草稿。恢复网络后，会先检查服务器版本，再决定自动同步或提示冲突处理。</p>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { OfflineDraftSyncState } from '@/types/offline'

const props = defineProps<{
  modelValue: boolean
  draftSyncState: OfflineDraftSyncState
  offlineStatusTitle: string
  offlineStatusDescription: string
  networkState: 'online' | 'offline'
  offlineSyncStateLabel: string
  hasOfflineDraft: boolean
  offlineDraftUpdatedAt: string
  serverBaselineTime: string
  isSyncingOfflineDraft: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  sync: []
  openConflict: []
  restoreDraft: []
  clearDraft: []
}>()

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})
</script>

<style lang="scss" scoped>
.offline-center {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.offline-status-card {
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(180deg, #eef4ff 0%, #f8fbff 100%);
  color: #284b95;
}

.offline-status-card--pending,
.offline-status-card--syncing {
  background: linear-gradient(180deg, #eef4ff 0%, #f8fbff 100%);
  color: #284b95;
}

.offline-status-card--conflict {
  background: linear-gradient(180deg, #fff1f3 0%, #fff7f8 100%);
  color: #c01048;
}

.offline-status-card--synced {
  background: linear-gradient(180deg, #edfdf3 0%, #f7fff9 100%);
  color: #027a48;
}

.offline-status-title {
  font-size: 16px;
  font-weight: 700;
}

.offline-status-desc {
  margin-top: 8px;
  line-height: 1.7;
}

.offline-center-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.offline-metric {
  padding: 14px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #fff;
}

.offline-metric-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #667085;
}

.offline-center-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.offline-center-note {
  padding: 16px;
  border-radius: 16px;
  background: #f8fafc;
  color: #475467;
  line-height: 1.8;
}

.offline-section-title {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #344054;
}

@media (max-width: 960px) {
  .offline-center-grid {
    grid-template-columns: 1fr;
  }
}
</style>
