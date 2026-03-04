<template>
  <div>
    <div>
      <tool-bar
        v-if="editor"
        :editor="editor"
        :can-collaborate="canCollaborate"
        :is-collaborative="isCollaborative"
        class="tool-bar"
        @toggle-collaboration="emit('toggle-collaboration')"
      />
      <editor-content :editor="editorForContent" class="editor-content" />
      <code-selector
        :editor="editor"
        :current-language="currentLanguage"
        :style="codeSelectorStyle"
        v-if="showCodeSelector"
      />
      <bubble-bar :editor="editor" class="bubble-bar" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { EditorContent } from '@tiptap/vue-3'
import { computed, ref, watchEffect, nextTick } from 'vue'
import ToolBar from './ToolBar.vue'
import CodeSelector from '@/pages/editor/components/CodeSelector.vue'
import BubbleBar from '@/pages/editor/components/BubbleBar.vue'
import { Editor } from '@tiptap/vue-3'

const { editor, canCollaborate, isCollaborative } = defineProps<{
  editor: Editor | null
  canCollaborate: boolean
  isCollaborative: boolean
}>()

const emit = defineEmits<{
  'toggle-collaboration': []
}>()

const showCodeSelector = ref(false)
const currentLanguage = ref('')
const codeSelectorStyle = ref({
  position: 'absolute',
  top: '0px',
  left: '0px',
})
const editorForContent = computed(() => editor ?? undefined)

watchEffect(async () => {
  if (!editor) {
    showCodeSelector.value = false
    return
  }

  showCodeSelector.value = editor.isActive('codeBlock')
  if (!showCodeSelector.value) {
    return
  }

  const lang = editor.getAttributes('codeBlock').language
  currentLanguage.value = lang || ''

  await nextTick()

  const dom = editor.view.domAtPos(editor.state.selection.from)?.node as HTMLElement
  const pre = dom.closest('pre')

  if (!pre) {
    return
  }

  const rect = pre.getBoundingClientRect()
  const offsetTop = window.scrollY + rect.bottom - 35
  const offsetLeft = window.scrollX + rect.right - 110

  codeSelectorStyle.value.top = `${offsetTop}px`
  codeSelectorStyle.value.left = `${offsetLeft}px`
})
</script>
