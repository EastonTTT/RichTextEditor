<template>
  <div class="toolbar">
    <!-- 加粗 -->
    <button @click="toggleBold">Bold</button>
    <!-- 斜体 -->
    <button @click="toggleItalic">Italic</button>
    <!-- 删除线 -->
    <button @click="toggleStrike">Strike</button>
    <!-- 下划线 -->
    <button @click="toggleUnderline">Underline</button>
    <!-- 链接 -->
    <button @click="setLink('www.baidu.com')">Link</button>
    <button @click="unsetLink">unsetLink</button>
    <!-- 图片 -->
    <button @click="addImage">Image</button>
    <!-- 任务列表 -->
    <button @click="addTask">Task</button>
    <!-- 标题 -->
    <button @click="addHead(1)" :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }">H1</button>
    <button @click="addHead(2)" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }">H2</button>
    <button @click="addHead(3)" :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }">H3</button>
    <!-- 代码块 -->
    <button @click="toggleCode">Code</button>
    <!-- 撤销操作 -->
    <button @click="undo" :disabled="!editor.can().undo()">undo</button>
    <!-- 重做操作 -->
    <button @click="redo" :disabled="!editor.can().redo()">redo</button>

  </div>
</template>

<script setup lang="ts">
import type { Editor } from "@tiptap/vue-3"
import type { HeadingLevel } from "@/types/extensionTypes";
const { editor } = defineProps<{ editor: Editor | null }>()

if (!editor) { throw new Error('editor is not defined') }
const toggleBold = () => editor?.chain().focus().toggleBold().run()
const toggleItalic = () => editor?.chain().focus().toggleItalic().run()
const toggleStrike = () => editor?.chain().focus().toggleStrike().run()
const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run()
const setLink = (url: string) => {
  //TODO: 补充弹窗，让用户输入跳转的链接。补充url校验逻辑。
  if (url) {
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  } else {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run()

  }
}
const unsetLink = () => editor?.chain().focus().unsetLink().run()
const addImage = () => {
  const url: string = prompt('请输入图片链接')!//后续可换成其他的获取逻辑，同Link
  if (url) {
    editor?.chain().focus().setImage({ src: url }).run()
  }
}

const addTask = () => editor?.chain().focus().toggleTaskList().run()


const toggleCode = () => { }

const addHead = (level: HeadingLevel) => {
  editor.chain().focus().toggleHeading({ level: level })
}

const undo = () => editor?.chain().focus().undo().run()
const redo = () => editor?.chain().focus().redo().run()



</script>

<style></style>
