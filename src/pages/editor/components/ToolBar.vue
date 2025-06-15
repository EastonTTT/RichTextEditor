<template>
  <div class="toolbar">
    <!-- 加粗 -->
    <button @click="toggleBold" :class="{ 'is-active': editor.isActive('bold') }">Bold</button>
    <!-- 斜体 -->
    <button @click="toggleItalic" :class="{ 'is-active': editor.isActive('italic') }">Italic</button>
    <!-- 删除线 -->
    <button @click="toggleStrike" :class="{ 'is-active': editor.isActive('strike') }">Strike</button>
    <!-- 下划线 -->
    <button @click="toggleUnderline" :class="{ 'is-active': editor.isActive('underline') }">Underline</button>
    <!-- 链接 -->
    <button @click="setLink()">Link</button>
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
    <button @click="toggleCode" :class="{ 'is-active': editor.isActive('codeBlock') }">Code</button>
    <!-- 撤销操作 -->
    <button @click="undo" :disabled="!editor.can().undo()">undo</button>
    <!-- 重做操作 -->
    <button @click="redo" :disabled="!editor.can().redo()">redo</button>
    <!-- 字号调整框 -->
    <select class="font-size-select" v-model="fontSize" @change="onFontSizeChange">
      <option disabled value="">字号</option>
      <option v-for="size in sizes" :key="size" :value="size">{{ size }}</option>
    </select>


  </div>
</template>

<script setup lang="ts">
import type { Editor } from "@tiptap/vue-3"
import type { HeadingLevel } from "@/types/extensionTypes";
import { sizes } from "@/constants/editor"
const { editor } = defineProps<{ editor: Editor | null }>()
import { ref, onMounted } from 'vue'

const fontSize = ref('')

if (!editor) { throw new Error('editor is not defined') }
//按钮逻辑函数：
//加粗
const toggleBold = () => editor?.chain().focus().toggleBold().run()
//斜体
const toggleItalic = () => editor?.chain().focus().toggleItalic().run()
//删除线
const toggleStrike = () => editor?.chain().focus().toggleStrike().run()
//下划线
const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run()
//超链接
const setLink = () => {
  //TODO: 补充弹窗，让用户输入跳转的链接。补充url校验逻辑。
  const url: string = prompt('请输入链接')!//后续可换成其他的获取逻辑，同Link
  if (url) {
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  } else {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run()

  }
}
const unsetLink = () => editor?.chain().focus().unsetLink().run()
//  图片
const addImage = () => {
  const url: string = prompt('请输入图片链接')!//后续可换成其他的获取逻辑，同Link
  if (url) {
    editor?.chain().focus().setImage({ src: url }).run()
  }
}
//  任务列表
const addTask = () => editor?.chain().focus().toggleTaskList().run()
//  代码块
const toggleCode = () => editor?.chain().focus().toggleCodeBlock().run()
//  标题
const addHead = (level: HeadingLevel) => {
  console.log(level)
  editor?.chain().focus().toggleHeading({ level: level }).run()
}
//  撤销
const undo = () => editor?.chain().focus().undo().run()
//  重做
const redo = () => editor?.chain().focus().redo().run()

//修改字体大小
const onFontSizeChange = () => {
  const size = fontSize.value
  // console.log('size', size)
  editor?.chain().focus().setFontSize(size).run()
}

onMounted(() => {
  if (!editor) return
  editor.on('selectionUpdate', () => {
    const currentFontSize = editor.getAttributes('textStyle').fontSize
    if (sizes.includes(currentFontSize)) {
      fontSize.value = currentFontSize
    } else {
      fontSize.value = '字号'
    }
    // fontSize.value = currentFontSize || '未设置'
    // console.log(fontSize.value)
  })
})



</script>

<style lang="scss" scoped>
button {
  background: #f5f5f5;
  // border: none;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  margin: 5px;
}

button.is-active {
  background-color: #409eff;
  color: white;
  font-weight: bold;
}

.font-size-select {
  padding: 4px 8px;
  border: 2px solid black;
  background-color: #f5f5f5;
  font-size: 14px;
  border-radius: 4px;
  margin-right: 6px;
  cursor: pointer;
  height: 32px;
  appearance: none;
  -webkit-appearance: none;
}

.font-size-select:focus {
  outline: none;
  box-shadow: 0 0 0 2px #aaa;
}
</style>
