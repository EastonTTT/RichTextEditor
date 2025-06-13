<template>
  <div>
    <tool-bar v-if="editor" :editor="editor!" />
    <editor-content :editor="editor" class="editor-content" />
  </div>
</template>

<script setup lang="ts">
import { useEditor, EditorContent } from '@tiptap/vue-3'
import ToolBar from './ToolBar.vue'
import { basicExtensions } from '@/utils/editorExtensions'
import '@/styles/editor.scss'
const editor = useEditor({
  extensions: basicExtensions,
  content: `<p>this is a placeholder..</p>`,
})
</script>

<style></style>
