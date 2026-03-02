<template>
  <div class="editor-header">
    <div class="left-side">
      <button class="nav-button" @click="emit('back')">
        <HomeIcon size="large" />
      </button>
      <div class="title-block">
        <el-input :model-value="title" size="large" @input="emit('update:title', $event)" />
        <div class="meta">
          <span v-if="isSaving">Saving...</span>
          <span v-else>Last saved: {{ lastSavedLabel }}</span>
          <span class="dot">•</span>
          <span>{{ isCollaborative ? 'Collaboration ready' : 'Solo mode' }}</span>
        </div>
      </div>
    </div>
    <div class="right-side">
      <div class="status-tag" :class="{ active: isCollaborative }">
        {{ isCollaborative ? 'Collab On' : 'Collab Off' }}
      </div>
      <button class="action-button" @click="emit('save')">
        <SaveIcon size="large" />
      </button>
      <button class="action-button" @click="exportAsPDF">
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

const { editor, title, isSaving, lastSavedAt, isCollaborative } = defineProps<{
  editor: Editor | null
  title: string
  isSaving: boolean
  lastSavedAt: string
  isCollaborative: boolean
}>()

const emit = defineEmits<{
  back: []
  save: []
  'update:title': [value: string]
}>()

const lastSavedLabel = computed(() => {
  if (!lastSavedAt) {
    return 'not saved yet'
  }

  return new Date(lastSavedAt).toLocaleString()
})

const exportAsPDF = () => {
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
      pdf.save(`${title || 'document'}.pdf`)
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

    pdf.save(`${title || 'document'}.pdf`)
  })
}
</script>

<style lang="scss" scoped>
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.title-block {
  margin-left: 12px;
  min-width: 340px;
}

.meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 6px;
  color: #667085;
  font-size: 12px;
}

.dot {
  color: #d0d5dd;
}

.status-tag {
  padding: 6px 10px;
  border-radius: 999px;
  background: #f2f4f7;
  color: #344054;
  margin-right: 12px;
}

.status-tag.active {
  background: #ecfdf3;
  color: #027a48;
}

.nav-button,
.action-button {
  appearance: none;
  border: 1px solid #d0d5dd;
  background: #fff;
  border-radius: 10px;
  padding: 8px;
  cursor: pointer;
  margin-left: 8px;
}
</style>
