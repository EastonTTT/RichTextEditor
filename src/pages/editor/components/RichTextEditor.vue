<template>
  <div class="wrapper">
    <div class="toc-container">
      <table-of-contents :editor="editor!" class="toc" />
    </div>
    <div>
      <tool-bar v-if="editor" :editor="editor!" />
      <editor-content :editor="editor" class="editor-content" />
      <code-selector :editor="editor!" :current-language="currentLanguage" :style="codeSelectorStyle"
        v-if="showCodeSelector" />
      <bubble-bar :editor="editor!" />
    </div>
  </div>

</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { ref, watchEffect, nextTick } from 'vue'
import ToolBar from './ToolBar.vue'
import { basicExtensions } from '@/utils/editorExtensions'
import CodeSelector from '@/pages/editor/components/CodeSelector.vue'
import BubbleBar from '@/pages/editor/components/BubbleBar.vue'
import TableOfContents from '@/pages/editor/components/TableOfContents.vue';

import '@/styles/editor.scss'
const editor = useEditor({
  extensions: basicExtensions,
  content: '<p></p>',
})

const showCodeSelector = ref(false)
const currentLanguage = ref('')
const codeSelectorStyle = ref({
  position: 'absolute',
  top: '0px',
  left: '0px',
})

watchEffect(async () => {
  if (!editor.value) return

  showCodeSelector.value = editor.value.isActive('codeBlock')
  if (showCodeSelector.value) {
    //获取当前语言
    const lang = editor.value.getAttributes('codeBlock').language
    currentLanguage.value = lang || ''

    await nextTick()

    // 拿到当前选区位置的 DOM 元素
    const dom = editor.value.view.domAtPos(editor.value.state.selection.from)?.node as HTMLElement

    // 获取最近的 <pre> 或 .code-block
    const pre = dom.closest('pre')

    if (pre) {
      const rect = pre.getBoundingClientRect()
      const offsetTop = window.scrollY + rect.bottom - 35
      const offsetLeft = window.scrollX + rect.right - 110

      codeSelectorStyle.value.top = `${offsetTop}px`
      codeSelectorStyle.value.left = `${offsetLeft}px`
    }

  }
})

</script>

<style></style>
