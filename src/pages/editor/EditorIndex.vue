<template>
  <div>
    <editor-header />
  </div>
  <div class="wrapper">
    <div class="toc-container">
      <table-of-contents :editor="editor!" class="toc" />
    </div>
    <div class="editor-container">
      <rich-text-editor :editor="editor!" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import RichTextEditor from '@/pages/editor/components/RichTextEditor.vue';
import TableOfContents from '@/pages/editor/components/TableOfContents.vue';
import EditorHeader from './components/EditorHeader.vue';
import { basicExtensions } from '@/utils/editorExtensions'
import { useEditor } from '@tiptap/vue-3';
import '@/styles/editor.scss';

const editor = useEditor({
  extensions: basicExtensions,
  content: '<p></p>',
})

</script>
<style lang="scss" scoped></style>
