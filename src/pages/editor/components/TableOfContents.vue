<template>
  <div class="toc">
    <p class="toc-title">Contents</p>
    <div v-if="headings.length === 0" class="toc-empty">Add headings to generate a table of contents.</div>
    <div
      v-for="heading in headings"
      :key="heading.id"
      @click="scrollToHeading(heading.pos)"
      :class="[`toc-item`, `level-${heading.level}`]"
    >
      {{ heading.text }}
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { Editor } from '@tiptap/vue-3'
import type { HeadingItem } from '@/types/extensionTypes'

const { editor } = defineProps<{ editor: Editor | null }>()
const headings = ref<HeadingItem[]>([])
let cleanup: (() => void) | null = null

function collectHeadings(currentEditor: Editor | null) {
  if (!currentEditor) {
    headings.value = []
    return
  }

  const result: HeadingItem[] = []

  currentEditor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      result.push({
        level: node.attrs.level,
        text: node.textContent,
        id: `heading-${pos}`,
        pos,
      })
    }
  })

  headings.value = result
}

watch(
  () => editor,
  (currentEditor) => {
    cleanup?.()
    collectHeadings(currentEditor)

    if (!currentEditor) {
      return
    }

    const syncHeadings = () => collectHeadings(currentEditor)
    currentEditor.on('update', syncHeadings)
    currentEditor.on('selectionUpdate', syncHeadings)
    cleanup = () => {
      currentEditor.off('update', syncHeadings)
      currentEditor.off('selectionUpdate', syncHeadings)
    }
  },
  { immediate: true },
)

function scrollToHeading(pos: number) {
  const dom = editor?.view.nodeDOM(pos)
  if (dom instanceof HTMLElement) {
    dom.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

onBeforeUnmount(() => {
  cleanup?.()
})
</script>

<style lang="scss" scoped>
.toc {
  padding: 16px;
  border-right: 1px solid #e5e7eb;
}

.toc-title {
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 700;
  color: #667085;
  text-transform: uppercase;
}

.toc-empty {
  color: #98a2b3;
  font-size: 13px;
  line-height: 1.5;
}

.toc-item {
  padding: 6px 8px;
  border-radius: 8px;
  cursor: pointer;
  color: #344054;
}

.toc-item:hover {
  background: #f2f4f7;
}

.level-2 {
  padding-left: 16px;
}

.level-3 {
  padding-left: 24px;
}
</style>
