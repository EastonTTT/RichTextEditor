<template>
  <div class="toolbar">
    <!-- 加粗 -->
    <!-- <el-tooltip content="Bold" placement="bottom">
      <button @click="toggleBold" :class="{ 'is-active': editor.isActive('bold') }">
        <TextformatBoldIcon class="icon" />
      </button>
    </el-tooltip> -->

    <!-- 斜体 -->
    <!-- <el-tooltip content="Italic" placement="bottom">
      <button @click="toggleItalic" :class="{ 'is-active': editor.isActive('italic') }">
        <TextformatItalicIcon class="icon" />
      </button>
    </el-tooltip> -->

    <!-- 删除线 -->
    <!-- <el-tooltip content="Strike" placement="bottom">
      <button @click="toggleStrike" :class="{ 'is-active': editor.isActive('strike') }">
        <StrikeIcon class="icon" />
      </button>
    </el-tooltip> -->

    <!-- 下划线 -->
    <!-- <el-tooltip content="Underline" placement="bottom">
      <button @click="toggleUnderline" :class="{ 'is-active': editor.isActive('underline') }">
        <UnderlineIcon class="icon" />
      </button>
    </el-tooltip> -->
    <!-- 链接 -->
    <el-tooltip content="Add Link" placement="bottom">
      <button @click="setLink">
        link
        <Link1Icon class="icon" />
      </button>
    </el-tooltip>

    <!-- 取消链接 -->
    <el-tooltip content="Unset Link" placement="bottom">
      <button @click="unsetLink">
        unsetLink
        <LinkUnlinkIcon class="icon" />
      </button>
    </el-tooltip>

    <!-- 图片 -->
    <el-tooltip content="Add Image" placement="bottom">
      <button @click="addImage">
        Image
        <ImageAddIcon class="icon" />
      </button>
    </el-tooltip>

    <!-- 任务列表 -->
    <el-tooltip content="Task List" placement="bottom">
      <button @click="addTask" :class="{ 'is-active': editor.isActive('taskList') }">
        TaskList
        <TaskChecked1Icon class="icon" />
      </button>
    </el-tooltip>

    <!-- 有序列表 -->
    <el-tooltip content="Ordered List" placement="bottom">
      <button @click="addOrderedList" :class="{ 'is-active': editor.isActive('orderedList') }">
        OrderedList
        <OrderDescendingIcon class="icon" />
      </button>
    </el-tooltip>

    <!-- 无序列表 -->
    <el-tooltip content="Unordered List" placement="bottom">
      <button @click="addBulletList" :class="{ 'is-active': editor.isActive('bulletList') }">
        UnorderedList
        <ListIcon class="icon" />
      </button>
    </el-tooltip>

    <!-- 分割线 -->
    <el-tooltip content="Horizontal Rule" placement="bottom">
      <button @click="addDivider">
        Divider
        <ComponentDividerVerticalIcon class="icon" />
      </button>
    </el-tooltip>

    <!-- 标题 -->
    <el-tooltip content="Heading 1" placement="bottom">
      <button @click="addHead(1)" :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }">
        H1
      </button>
    </el-tooltip>
    <el-tooltip content="Heading 2" placement="bottom">
      <button @click="addHead(2)" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }">
        H2
      </button>
    </el-tooltip>
    <el-tooltip content="Heading 3" placement="bottom">
      <button @click="addHead(3)" :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }">
        H3
      </button>
    </el-tooltip>

    <!-- 代码块 -->
    <el-tooltip content="Code Block" placement="bottom">
      <button @click="toggleCode" :class="{ 'is-active': editor.isActive('codeBlock') }">
        Code
        <CodeIcon class="icon" />
      </button>
    </el-tooltip>

    <!-- 撤销操作 -->
    <el-tooltip content="Undo" placement="bottom">
      <button @click="undo" :disabled="!editor.can().undo()">
        undo
        <BackwardIcon class="icon" />
      </button>
    </el-tooltip>

    <!-- 重做操作 -->
    <el-tooltip content="Redo" placement="bottom">
      <button @click="redo" :disabled="!editor.can().redo()">
        redo
        <ForwardIcon class="icon" />
      </button>
    </el-tooltip>

    <!-- 开启协作 -->
    <el-tooltip content="Enable Collaboration" placement="bottom">
      <button @click="toggleCollaboration" :class="{ 'is-active': isCollaborative }" v-if="userRole === 'owner'">
        collab
      </button>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import { Editor } from "@tiptap/vue-3"
import {
  Link1Icon,
  LinkUnlinkIcon,
  ImageAddIcon,
  ComponentDividerVerticalIcon,
  BackwardIcon,
  ForwardIcon,
  TaskChecked1Icon,
  ListIcon,
  OrderDescendingIcon,
  CodeIcon,
} from "tdesign-icons-vue-next";
import { defineEmits, inject } from "vue"
import type { Role } from "@/types/editorTypes";

const emit = defineEmits()
const { editor } = defineProps<{ editor: Editor | null }>()

if (!editor) { throw new Error('editor is not defined') }
const userRole = inject<Role>('role')
const isCollaborative = inject<boolean>('isCollaborative')

// 按钮逻辑函数

const toggleBold = () => editor?.chain().focus().toggleBold().run()
const toggleItalic = () => editor?.chain().focus().toggleItalic().run()
const toggleStrike = () => editor?.chain().focus().toggleStrike().run()
const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run()

const addBulletList = () => editor?.chain().focus().toggleBulletList().run()
const addOrderedList = () => editor?.chain().focus().toggleOrderedList().run()
const addDivider = () => editor?.chain().focus().setHorizontalRule().run()

const setLink = () => {
  const url: string = prompt('请输入链接')!
  if (url) {
    editor?.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  } else {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run()
  }
}

const unsetLink = () => editor?.chain().focus().unsetLink().run()
const addImage = () => {
  const url: string = prompt('请输入图片链接')!
  if (url) {
    editor?.chain().focus().setImage({ src: url }).run()
  }
}

const addTask = () => editor?.chain().focus().toggleTaskList().run()
const toggleCode = () => editor?.chain().focus().toggleCodeBlock().run()

const addHead = (level: number) => editor?.chain().focus().toggleHeading({ level }).run()

const undo = () => editor?.chain().focus().undo().run()
const redo = () => editor?.chain().focus().redo().run()

const toggleCollaboration = () => {
  emit("toggleCollaboration")
}
</script>

<style lang="scss" scoped>
button {
  background-color: white;
  padding: 4px 8px;
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.2s ease;
  margin: 5px;
  white-space: nowrap;
}

button.is-active {
  background-color: #409eff;
  color: white;
  font-weight: bold;
}

.icon {
  size: 12px;
  margin-bottom: 2px;
}
</style>
