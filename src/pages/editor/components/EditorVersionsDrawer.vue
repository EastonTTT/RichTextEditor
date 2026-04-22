<template>
  <el-drawer v-model="drawerVisible" title="历史版本" size="460px">
    <div class="version-actions">
      <el-button type="primary" :loading="isVersionActionRunning" @click="emit('createSnapshot')">创建快照</el-button>
      <el-button :loading="isVersionsLoading" @click="emit('refresh')">刷新</el-button>
    </div>

    <el-empty v-if="!versions.length && !isVersionsLoading" description="还没有历史版本" />

    <div v-else class="version-timeline">
      <div class="version-overview-card">
        <div>
          <div class="version-overview-title">当前文档快照</div>
          <div class="version-overview-meta">最近保存：{{ formatVersionTime(lastSavedAt || new Date().toISOString()) }}</div>
        </div>
        <div class="version-overview-count">
          {{ contentVersions.length }} 个内容版本
          <span v-if="restoreRecords.length" class="version-overview-count__extra">
            含 {{ restoreRecords.length }} 条旧恢复记录
          </span>
        </div>
      </div>

      <div v-if="restoreRecords.length" class="restore-records-card">
        <div class="restore-records-card__header">
          <div class="restore-records-card__title">旧恢复记录</div>
          <p class="restore-records-card__tip">
            这部分仅用于兼容旧数据。新恢复逻辑不会再额外创建恢复记录，而是直接将被恢复版本提升到最新顺序。
          </p>
        </div>

        <div class="restore-records-list">
          <div v-for="version in restoreRecords" :key="version.id" class="restore-record-item">
            <div class="version-top">
              <strong>v{{ version.versionNo }}</strong>
              <span class="version-reason-badge" :class="`version-reason-badge--${getVersionReasonMeta(version.reason).tone}`">
                {{ getVersionReasonMeta(version.reason).label }}
              </span>
            </div>
            <div class="version-meta">
              <span>操作人：{{ version.createdByName }}</span>
              <span>{{ formatVersionTime(getVersionDisplayTime(version)) }}</span>
            </div>
            <p class="version-summary">{{ version.summary || '这是一条恢复操作记录。' }}</p>
            <div class="version-ops version-ops--single">
              <el-button size="small" @click="emit('preview', version.id)">查看详情</el-button>
              <el-button size="small" type="danger" plain :loading="isVersionActionRunning" @click="emit('delete', version.id)">
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <el-timeline v-if="contentVersions.length">
        <el-timeline-item
          v-for="version in contentVersions"
          :key="version.id"
          :timestamp="formatVersionTime(getVersionDisplayTime(version))"
          :type="getVersionReasonMeta(version.reason).type"
          :hollow="version.id !== contentVersions[0]?.id"
          placement="top"
        >
          <div class="version-item">
            <div class="version-top">
              <strong>v{{ version.versionNo }}</strong>
              <span class="version-reason-badge" :class="`version-reason-badge--${getVersionReasonMeta(version.reason).tone}`">
                {{ getVersionReasonMeta(version.reason).label }}
              </span>
            </div>
            <div class="version-meta">
              <span>操作人：{{ version.createdByName }}</span>
              <span>标题：{{ version.title || '未命名文档' }}</span>
            </div>
            <p class="version-summary">{{ version.summary || '该版本没有额外摘要。' }}</p>
            <div class="version-ops">
              <el-button size="small" @click="emit('preview', version.id)">预览差异</el-button>
              <el-button size="small" :loading="isVersionActionRunning" @click="emit('restore', version.id)">
                恢复此版本
              </el-button>
              <el-button size="small" type="danger" plain :loading="isVersionActionRunning" @click="emit('delete', version.id)">
                删除
              </el-button>
            </div>
          </div>
        </el-timeline-item>
      </el-timeline>
      <el-empty v-else description="当前只有恢复记录，暂时没有可展示的内容版本" />
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DocumentVersion } from '@/types/document'
import {
  formatVersionTime,
  getVersionDisplayTime,
  getVersionReasonMeta,
  isRestoreRecord,
} from '../composables/useVersionPresentation'

const props = defineProps<{
  modelValue: boolean
  isVersionActionRunning: boolean
  isVersionsLoading: boolean
  versions: DocumentVersion[]
  lastSavedAt: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  createSnapshot: []
  refresh: []
  preview: [versionId: string]
  restore: [versionId: string]
  delete: [versionId: string]
}>()

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

const contentVersions = computed(() => props.versions.filter((version) => !isRestoreRecord(version.reason)))
const restoreRecords = computed(() => props.versions.filter((version) => isRestoreRecord(version.reason)))
</script>

<style lang="scss" scoped>
.version-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
}

.version-timeline {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.version-overview-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
  background: linear-gradient(135deg, #0f4cda 0%, #2f7bff 100%);
  color: #fff;
}

.version-overview-title {
  font-size: 16px;
  font-weight: 700;
}

.version-overview-meta {
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.version-overview-count {
  padding: 10px 12px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  font-size: 12px;
  font-weight: 700;
}

.version-overview-count__extra {
  display: block;
  margin-top: 4px;
  font-weight: 500;
  opacity: 0.82;
}

.restore-records-card {
  padding: 14px;
  border: 1px solid #f2e4c7;
  border-radius: 18px;
  background: linear-gradient(180deg, #fffaf0 0%, #fffdf8 100%);
}

.restore-records-card__header {
  margin-bottom: 12px;
}

.restore-records-card__title {
  font-size: 14px;
  font-weight: 700;
  color: #7a3e0b;
}

.restore-records-card__tip {
  margin: 6px 0 0;
  color: #9a670d;
  font-size: 12px;
  line-height: 1.6;
}

.restore-records-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.restore-record-item {
  border: 1px dashed #e7c992;
  border-radius: 14px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.76);
}

.version-item {
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 14px;
  background: linear-gradient(180deg, #fcfcfd 0%, #ffffff 100%);
}

.version-top,
.version-meta,
.version-ops {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.version-ops--single {
  justify-content: flex-end;
}

.version-top,
.version-meta {
  margin-bottom: 8px;
}

.version-meta {
  color: #667085;
  font-size: 12px;
}

.version-summary {
  margin: 0 0 10px;
  color: #344054;
  font-size: 13px;
  line-height: 1.7;
}

.version-reason-badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 700;
}

.version-reason-badge--neutral {
  background: #f2f4f7;
  color: #475467;
}

.version-reason-badge--brand {
  background: #eff4ff;
  color: #175ce6;
}

.version-reason-badge--success {
  background: #edfdf3;
  color: #027a48;
}

.version-reason-badge--warning {
  background: #fff7ed;
  color: #b54708;
}

.version-reason-badge--danger {
  background: #fff1f3;
  color: #c01048;
}
</style>
