<template>
  <div class="editor-header">
    <div class="left-side">
      <button class="nav-button" type="button" @click="emit('back')">
        <HomeIcon size="large" />
      </button>
      <div class="title-block">
        <el-input :model-value="title" size="large" @input="emit('update:title', $event)" />
        <div class="meta">
          <span>{{ saveStatusLabel }}</span>
          <span class="dot">|</span>
          <span>{{ isCollaborative ? 'Collaboration ready' : 'Solo mode' }}</span>
          <span class="dot">|</span>
          <span>{{ wordCount }} words</span>
          <span>{{ characterCount }} chars</span>
        </div>
      </div>
    </div>
    <div class="right-side">
      <div class="search-panel">
        <el-input
          class="search-input"
          size="small"
          :model-value="searchQuery"
          placeholder="Search in document"
          @input="emit('update:search', $event)"
        />
        <span class="search-status">{{ searchStatusLabel }}</span>
        <button class="mini-button" type="button" :disabled="searchMatchCount === 0" @click="emit('search-prev')">
          Prev
        </button>
        <button class="mini-button" type="button" :disabled="searchMatchCount === 0" @click="emit('search-next')">
          Next
        </button>
      </div>

      <el-select
        class="visibility-select"
        size="small"
        :model-value="visibility"
        @update:model-value="emit('update:visibility', $event)"
      >
        <el-option label="Private" value="private" />
        <el-option label="Shared" value="shared" />
      </el-select>

      <button class="mini-button" type="button" @click="emit('toggle-settings')">Settings</button>

      <div class="status-tag" :class="{ active: isCollaborative, dirty: isDirty }">
        {{ isDirty ? 'Unsaved' : isCollaborative ? 'Collab On' : 'Saved' }}
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

const {
  editor,
  title,
  isSaving,
  lastSavedAt,
  isCollaborative,
  isDirty,
  saveError,
  visibility,
  wordCount,
  characterCount,
  searchQuery,
  searchMatchCount,
  activeSearchIndex,
} = defineProps<{
  editor: Editor | null
  title: string
  isSaving: boolean
  lastSavedAt: string
  isCollaborative: boolean
  isDirty: boolean
  saveError: string
  visibility: DocumentVisibility
  wordCount: number
  characterCount: number
  searchQuery: string
  searchMatchCount: number
  activeSearchIndex: number
}>()

const emit = defineEmits<{
  back: []
  save: []
  'update:title': [value: string]
  'update:visibility': [value: DocumentVisibility]
  'update:search': [value: string]
  'search-prev': []
  'search-next': []
  'toggle-settings': []
}>()

const saveStatusLabel = computed(() => {
  if (saveError) {
    return saveError
  }

  if (isSaving) {
    return 'Saving changes...'
  }

  if (isDirty) {
    return 'Unsaved changes'
  }

  if (!lastSavedAt) {
    return 'Not saved yet'
  }

  return `Last saved: ${new Date(lastSavedAt).toLocaleString()}`
})

const searchStatusLabel = computed(() => {
  if (!searchQuery.trim()) {
    return 'Search'
  }

  if (searchMatchCount === 0) {
    return '0 / 0'
  }

  return `${activeSearchIndex + 1} / ${searchMatchCount}`
})

function sanitizeFileName(value: string) {
  return value.trim().replace(/[<>:"/\\|?*\u0000-\u001F]/g, '-').slice(0, 60) || 'document'
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
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 20px;
  min-height: 78px;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  background-color: #fff;
  z-index: 10;
}

.left-side,
.right-side {
  display: flex;
  align-items: center;
}

.right-side {
  gap: 10px;
}

.title-block {
  margin-left: 12px;
  min-width: 420px;
}

.meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 6px;
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
}

.search-input {
  width: 220px;
}

.search-status {
  min-width: 52px;
  color: #667085;
  font-size: 12px;
  text-align: center;
}

.visibility-select {
  width: 110px;
}

.status-tag {
  padding: 6px 10px;
  border-radius: 999px;
  background: #ecfdf3;
  color: #027a48;
}

.status-tag.active {
  background: #f2f4f7;
  color: #344054;
}

.status-tag.dirty {
  background: #fff7ed;
  color: #c4320a;
}

.nav-button,
.action-button,
.mini-button {
  appearance: none;
  border: 1px solid #d0d5dd;
  background: #fff;
  border-radius: 10px;
  padding: 8px;
  cursor: pointer;
}

.mini-button {
  padding: 6px 10px;
  font-size: 12px;
}

.action-button:disabled,
.mini-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
