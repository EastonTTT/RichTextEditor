<template>
  <div class="editor-header">
    <div class="left-side">
      <button class="nav-button" type="button" @click="emit('back')">
        <HomeIcon size="large" />
      </button>
      <div class="title-block">
        <el-input
          :model-value="title"
          size="large"
          placeholder="请输入文档标题"
          @update:model-value="emit('update:title', `${$event ?? ''}`)"
        />
        <div class="meta">
          <span>{{ saveStatusLabel }}</span>
          <span class="dot">|</span>
          <span>所有者：{{ ownerName }}</span>
          <span class="dot">|</span>
          <span>{{ isCollaborative ? '协同已连接' : canCollaborate ? '共享文档' : '本地编辑' }}</span>
          <span class="dot">|</span>
          <span>{{ networkStatusLabel }}</span>
          <span class="dot">|</span>
          <span>{{ wordCount }} 字</span>
          <span>{{ characterCount }} 字符</span>
        </div>
      </div>
    </div>
    <div class="right-side">
      <div class="search-panel">
        <el-input
          class="search-input"
          size="small"
          :model-value="searchQuery"
          placeholder="搜索当前文档"
          @update:model-value="emit('update:search', `${$event ?? ''}`)"
        />
        <span class="search-status">{{ searchStatusLabel }}</span>
        <button class="mini-button" type="button" :disabled="searchMatchCount === 0" @click="emit('search-prev')">
          上一个
        </button>
        <button class="mini-button" type="button" :disabled="searchMatchCount === 0" @click="emit('search-next')">
          下一个
        </button>
      </div>

      <div v-if="collaborators.length > 0" class="collaborators-panel">
        <span class="collaborators-label">在线 {{ collaborators.length }} 人</span>
        <div class="collaborators-list">
          <span
            v-for="collaborator in collaborators"
            :key="`${collaborator.name}-${collaborator.color}`"
            class="collaborator-chip"
            :style="{ '--chip-color': collaborator.color, borderColor: collaborator.color }"
          >
            {{ collaborator.name }}
          </span>
        </div>
      </div>

      <el-select
        class="visibility-select"
        size="small"
        :model-value="visibility"
        :disabled="!canManageSharing"
        @update:model-value="emit('update:visibility', $event as DocumentVisibility)"
      >
        <el-option label="私有" value="private" />
        <el-option label="共享" value="shared" />
      </el-select>

      <button class="mini-button comments-button" type="button" @click="emit('toggle-comments')">
        评论{{ commentCount > 0 ? ` (${commentCount})` : '' }}
      </button>
      <button
        v-if="hasOfflineDraft || draftSyncState !== 'synced' || networkState === 'offline'"
        class="mini-button sync-button"
        type="button"
        @click="emit('open-sync-center')"
      >
        草稿同步
      </button>
      <button class="mini-button settings-button" type="button" @click="emit('toggle-settings')">共享/设置</button>
      <button class="mini-button history-button" type="button" @click="emit('toggle-versions')">历史版本</button>

      <div class="status-tag" :class="statusTagClass">
        {{ statusTagLabel }}
      </div>

      <button class="action-button" type="button" :disabled="isSaving" @click="emit('save')">
        <SaveIcon size="large" />
      </button>
      <button class="action-button" type="button" @click="exportAsPDF">
        <FileExportIcon size="large" />
      </button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { Editor } from '@tiptap/vue-3'
import { FileExportIcon, HomeIcon, SaveIcon } from 'tdesign-icons-vue-next'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import type { DocumentVisibility } from '@/types/document'
import type { OfflineDraftSyncState } from '@/types/offline'

interface CollaboratorPresence {
  name: string
  color: string
}

const {
  editor,
  title,
  isSaving,
  lastSavedAt,
  isCollaborative,
  isDirty,
  saveError,
  ownerName,
  visibility,
  canCollaborate,
  canManageSharing,
  commentCount,
  wordCount,
  characterCount,
  searchQuery,
  searchMatchCount,
  activeSearchIndex,
  collaborators,
  networkState,
  draftSyncState,
  hasOfflineDraft,
} = defineProps<{
  editor: Editor | null
  title: string
  isSaving: boolean
  lastSavedAt: string
  isCollaborative: boolean
  isDirty: boolean
  saveError: string
  ownerName: string
  visibility: DocumentVisibility
  canCollaborate: boolean
  canManageSharing: boolean
  commentCount: number
  wordCount: number
  characterCount: number
  searchQuery: string
  searchMatchCount: number
  activeSearchIndex: number
  collaborators: CollaboratorPresence[]
  networkState: 'online' | 'offline'
  draftSyncState: OfflineDraftSyncState
  hasOfflineDraft: boolean
}>()

const emit = defineEmits<{
  back: []
  save: []
  'update:title': [value: string]
  'update:visibility': [value: DocumentVisibility]
  'update:search': [value: string]
  'search-prev': []
  'search-next': []
  'toggle-comments': []
  'open-sync-center': []
  'toggle-settings': []
  'toggle-versions': []
}>()

const saveStatusLabel = computed(() => {
  if (saveError) {
    return saveError
  }

  if (isSaving) {
    return '正在保存...'
  }

  if (isDirty) {
    return '内容已修改，尚未保存'
  }

  if (!lastSavedAt) {
    return '尚未保存'
  }

  return `上次保存：${new Date(lastSavedAt).toLocaleString()}`
})

const searchStatusLabel = computed(() => {
  if (!searchQuery.trim()) {
    return '搜索'
  }

  if (searchMatchCount === 0) {
    return '0 / 0'
  }

  return `${activeSearchIndex + 1} / ${searchMatchCount}`
})

const networkStatusLabel = computed(() => (networkState === 'offline' ? '网络已断开' : '网络正常'))

const statusTagLabel = computed(() => {
  if (draftSyncState === 'conflict') {
    return '同步冲突'
  }

  if (networkState === 'offline') {
    return '离线编辑'
  }

  if (draftSyncState === 'syncing' || isSaving) {
    return '同步中'
  }

  if (draftSyncState === 'pending' || isDirty) {
    return '待同步'
  }

  if (isCollaborative) {
    return '协同中'
  }

  return '已保存'
})

const statusTagClass = computed(() => ({
  active: isCollaborative && draftSyncState === 'synced' && networkState === 'online' && !isDirty,
  dirty: draftSyncState === 'pending' || isDirty,
  warning: networkState === 'offline',
  danger: draftSyncState === 'conflict',
}))

function sanitizeFileName(value: string) {
  return value.trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-').slice(0, 60) || '文档'
}

function exportAsPDF() {
  const domElement = editor?.view.dom
  if (!domElement) {
    return
  }

  html2canvas(domElement, {
    scale: 2,
    useCORS: true,
  }).then((canvas) => {
    const margin = 20
    let position = 0
    const a4Width = 595.28
    const a4Height = 841.89
    const pageHeight = (a4Height * canvas.width) / a4Width
    let unallocatedHeight = canvas.height
    const imgWidth = a4Width - margin * 2
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    const pageData = canvas.toDataURL('image/png')

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4',
    })

    if (unallocatedHeight < pageHeight) {
      pdf.addImage(pageData, 'PNG', margin, margin, imgWidth, imgHeight)
      pdf.save(`${sanitizeFileName(title)}.pdf`)
      return
    }

    while (unallocatedHeight > 0) {
      pdf.addImage(pageData, 'PNG', margin, margin + position, imgWidth, imgHeight)
      unallocatedHeight -= pageHeight
      position -= pageHeight

      if (unallocatedHeight > 0) {
        pdf.addPage()
      }
    }

    pdf.save(`${sanitizeFileName(title)}.pdf`)
  })
}
</script>

<style lang="scss" scoped>
.editor-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 22px;
  min-height: 84px;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background-color: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(12px);
  z-index: 10;
}

.left-side,
.right-side {
  display: flex;
}

.left-side {
  flex: 1;
  min-width: 0;
  gap: 12px;
  align-items: flex-start;
}

.right-side {
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.title-block {
  min-width: 0;
  flex: 1;
}

.meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 24px;
  margin-top: 8px;
  color: #667085;
  font-size: 12px;
}

.dot {
  color: #d0d5dd;
}

.search-panel {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 40px;
}

.collaborators-panel {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f8fafc;
}

.collaborators-label {
  font-size: 12px;
  color: #475467;
  white-space: nowrap;
}

.collaborators-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.collaborator-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  background: #fff;
  font-size: 12px;
  color: #344054;
  border: 1px solid #d0d5dd;
}

.collaborator-chip::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--chip-color);
}

.search-input {
  width: 220px;
}

:deep(.search-input .el-input__wrapper) {
  min-height: 40px;
  border-radius: 10px;
}

.search-status {
  min-width: 52px;
  color: #667085;
  font-size: 12px;
  text-align: center;
}

.visibility-select {
  width: 112px;
}

:deep(.title-block .el-input) {
  width: 100%;
}

:deep(.title-block .el-input__wrapper) {
  min-height: 40px;
  border-radius: 12px;
}

.comments-button,
.sync-button,
.settings-button,
.history-button,
.visibility-select,
.status-tag,
.action-button {
  height: 40px;
}

:deep(.visibility-select .el-select__wrapper) {
  min-height: 40px;
  border-radius: 10px;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  border-radius: 999px;
  background: #ecfdf3;
  color: #027a48;
}

.status-tag.active {
  background: #eef4ff;
  color: #175ce6;
}

.status-tag.dirty {
  background: #fff7ed;
  color: #c4320a;
}

.status-tag.warning {
  background: #fff4e5;
  color: #b54708;
}

.status-tag.danger {
  background: #fff1f3;
  color: #c01048;
}

.nav-button,
.action-button,
.mini-button {
  appearance: none;
  border: 1px solid #d0d5dd;
  background: #fff;
  border-radius: 10px;
  padding: 8px 10px;
  cursor: pointer;
}

.nav-button,
.action-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.nav-button {
  height: 40px;
  flex-shrink: 0;
}

.mini-button {
  height: 40px;
  font-size: 12px;
}

.action-button:disabled,
.mini-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
