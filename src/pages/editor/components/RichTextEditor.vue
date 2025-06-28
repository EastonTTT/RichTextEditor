<template>
  <div>
    <div>
        <!-- 引入模式切换组件 -->
      <ModeSwitch v-model="currentMode"/> 
      <tool-bar v-if="editor" :editor="editor!" class="tool-bar" @toggle-collaboration="toggleCollaboration" />
      <ai-summary :editor="editor!" :mode="currentMode" class="ai-summary" />
      <editor-content :editor="editor!" class="editor-content" />
      <code-selector :editor="editor!" :current-language="currentLanguage" :style="codeSelectorStyle"
        v-if="showCodeSelector" />
      <bubble-bar :editor="editor!" class="bubble-bar" />
      <!-- 评论区组件 -->
      <div class="comment-section">
        <text-comment />
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { EditorContent } from '@tiptap/vue-3'
import { ref, watchEffect, nextTick, defineEmits } from 'vue'
import ToolBar from './ToolBar.vue'
import CodeSelector from '@/pages/editor/components/CodeSelector.vue'
import BubbleBar from '@/pages/editor/components/BubbleBar.vue'
import { Editor } from '@tiptap/vue-3'
import AiSummary from './AiSummary.vue'
import ModeSwitch from './ModeSwitch.vue'
import TextComment from './TextComment.vue'
const { editor } = defineProps<{ editor: Editor | null }>()

const emit = defineEmits()
const showCodeSelector = ref(false)
const currentLanguage = ref('')
const codeSelectorStyle = ref({
  position: 'absolute',
  top: '0px',
  left: '0px',
})

watchEffect(async () => {
  if (!editor) return

  showCodeSelector.value = editor.isActive('codeBlock')
  if (showCodeSelector.value) {
    //获取当前语言
    const lang = editor.getAttributes('codeBlock').language
    currentLanguage.value = lang || ''

    await nextTick()

    // 拿到当前选区位置的 DOM 元素
    const dom = editor.view.domAtPos(editor.state.selection.from)?.node as HTMLElement

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

const toggleCollaboration = () => {
  emit('toggleCollaboration')
}
const currentMode = ref('edit'); // 初始模式为阅读

</script>

<style>
.comment-section {
  padding-top: 3rem;
}
</style>
