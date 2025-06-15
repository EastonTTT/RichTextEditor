<template>
  <div>
    <bubble-menu :editor="editor!" v-if="editor">
      <!-- 加粗 -->
      <button @click="toggleBold" :class="{ 'is-active': editor.isActive('bold') }">Bold</button>
      <!-- 斜体 -->
      <button @click="toggleItalic" :class="{ 'is-active': editor.isActive('italic') }">Italic</button>
      <!-- 删除线 -->
      <button @click="toggleStrike" :class="{ 'is-active': editor.isActive('strike') }">Strike</button>
      <!-- 下划线 -->
      <button @click="toggleUnderline" :class="{ 'is-active': editor.isActive('underline') }">Underline</button>
    </bubble-menu>
  </div>
</template>

<script lang="ts" setup>
import type { Editor } from '@tiptap/core';
import { BubbleMenu } from '@tiptap/vue-3';
const { editor } = defineProps<{ editor: Editor | null }>()

//加粗
const toggleBold = () => editor?.chain().focus().toggleBold().run()
//斜体
const toggleItalic = () => editor?.chain().focus().toggleItalic().run()
//删除线
const toggleStrike = () => editor?.chain().focus().toggleStrike().run()
//下划线
const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run()

</script>

<style lang="scss" scoped></style>
