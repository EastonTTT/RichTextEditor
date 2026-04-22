<template>
  <el-drawer v-model="drawerVisible" title="文档设置" size="420px">
    <div class="settings-panel">
      <el-form label-position="top">
        <el-form-item label="标题">
          <el-input :model-value="title" @update:model-value="emit('update:title', `${$event ?? ''}`)" />
        </el-form-item>

        <el-form-item label="所有者">
          <el-input :model-value="ownerName" readonly />
        </el-form-item>

        <el-form-item label="可见性">
          <el-select
            class="settings-field"
            :model-value="visibility"
            :disabled="!isOwner"
            @update:model-value="emit('update:visibility', $event as DocumentVisibility)"
          >
            <el-option label="私有" value="private" />
            <el-option label="共享" value="shared" />
          </el-select>
        </el-form-item>

        <el-form-item label="共享权限">
          <div class="field-tip prominent">
            先将上方“可见性”切换为“共享”，再选择允许访问这篇文档的协作者。
          </div>
        </el-form-item>

        <el-form-item v-if="isOwner && visibility === 'shared'" label="共享给指定用户">
          <el-select
            class="settings-field"
            :model-value="shareTargetIds"
            multiple
            filterable
            collapse-tags
            collapse-tags-tooltip
            placeholder="请选择可以访问此文档的用户"
            @update:model-value="emit('update:shareTargetIds', Array.isArray($event) ? $event : [])"
          >
            <el-option
              v-for="user in availableUsers"
              :key="user.id"
              :label="getUserDisplayName(user)"
              :value="user.id"
            />
          </el-select>
          <div class="field-tip">未被选中的账号将无法在列表、最近访问和协同房间中看到该文档。</div>
        </el-form-item>

        <el-form-item v-else-if="isOwner" label="共享给指定用户">
          <el-input model-value="当前为私有文档，切换为共享后可选择具体协作者。" readonly />
        </el-form-item>

        <el-form-item label="文档 ID">
          <el-input :model-value="documentId" readonly />
        </el-form-item>

        <el-form-item v-if="canCollaborate" label="协同房间">
          <el-input :model-value="roomName" readonly />
        </el-form-item>

        <el-form-item label="最近保存时间">
          <el-input :model-value="lastSavedAt ? new Date(lastSavedAt).toLocaleString() : '尚未保存'" readonly />
        </el-form-item>
      </el-form>

      <div class="settings-card">
        <div class="settings-card-title">共享对象</div>
        <div v-if="selectedShareUsers.length > 0" class="share-chip-list">
          <span
            v-for="user in selectedShareUsers"
            :key="user.id"
            class="share-chip"
            :style="{ '--chip-color': user.color }"
          >
            {{ getUserDisplayName(user) }}
          </span>
        </div>
        <div v-else class="settings-muted">当前没有额外协作者。</div>
      </div>

      <div class="settings-card">
        <div class="settings-card-title">统计信息</div>
        <div class="settings-stat">字数：{{ wordCount }}</div>
        <div class="settings-stat">字符数：{{ characterCount }}</div>
        <div class="settings-stat">搜索结果：{{ searchMatchCount }}</div>
      </div>

      <div v-if="isOwner" class="settings-card">
        <div class="settings-card-title">保存为模板</div>
        <el-input
          :model-value="templateTitle"
          placeholder="模板名称"
          @update:model-value="emit('update:templateTitle', `${$event ?? ''}`)"
        />
        <el-input
          :model-value="templateDescription"
          class="template-description"
          type="textarea"
          :rows="3"
          placeholder="模板说明，可用于下次快速复用"
          @update:model-value="emit('update:templateDescription', `${$event ?? ''}`)"
        />
        <el-button class="template-action" type="primary" :loading="isSavingTemplate" @click="emit('saveTemplate')">
          保存当前文档为模板
        </el-button>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DocumentVisibility } from '@/types/document'
import { getUserDisplayName, type UserProfile } from '@/types/user'

const props = defineProps<{
  modelValue: boolean
  title: string
  ownerName: string
  visibility: DocumentVisibility
  isOwner: boolean
  shareTargetIds: string[]
  availableUsers: UserProfile[]
  documentId: string
  canCollaborate: boolean
  roomName: string
  lastSavedAt: string
  selectedShareUsers: UserProfile[]
  wordCount: number
  characterCount: number
  searchMatchCount: number
  templateTitle: string
  templateDescription: string
  isSavingTemplate: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:title': [value: string]
  'update:visibility': [value: DocumentVisibility]
  'update:shareTargetIds': [value: string[]]
  'update:templateTitle': [value: string]
  'update:templateDescription': [value: string]
  saveTemplate: []
}>()

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})
</script>

<style lang="scss" scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-field {
  width: 100%;
}

.settings-card {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.settings-card-title {
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #667085;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.settings-stat + .settings-stat {
  margin-top: 8px;
}

.settings-muted,
.field-tip {
  margin-top: 8px;
  font-size: 12px;
  line-height: 1.7;
  color: #667085;
}

.field-tip.prominent {
  margin-top: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: #eff4ff;
  color: #284b95;
}

.share-chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.share-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border-radius: 999px;
  background: #eff4ff;
  color: #1d2939;
  font-size: 12px;
}

.share-chip::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--chip-color);
}

.template-description {
  margin-top: 12px;
}

.template-action {
  width: 100%;
  margin-top: 12px;
}
</style>
