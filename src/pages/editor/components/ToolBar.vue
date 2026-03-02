<template>
  <div class="toolbar">
    <el-tooltip content="Add Link" placement="bottom">
      <button @click="setLink">
        Link
        <Link1Icon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="Unset Link" placement="bottom">
      <button @click="unsetLink">
        Unlink
        <LinkUnlinkIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="Add Image" placement="bottom">
      <button @click="addImage">
        Image
        <ImageAddIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="Task List" placement="bottom">
      <button @click="addTask" :class="{ 'is-active': editor.isActive('taskList') }">
        Task
        <TaskChecked1Icon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="Ordered List" placement="bottom">
      <button @click="addOrderedList" :class="{ 'is-active': editor.isActive('orderedList') }">
        Ordered
        <OrderDescendingIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="Unordered List" placement="bottom">
      <button @click="addBulletList" :class="{ 'is-active': editor.isActive('bulletList') }">
        Bullet
        <ListIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="Horizontal Rule" placement="bottom">
      <button @click="addDivider">
        Divider
        <ComponentDividerVerticalIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="Heading 1" placement="bottom">
      <button @click="addHead(1)" :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }">H1</button>
    </el-tooltip>
    <el-tooltip content="Heading 2" placement="bottom">
      <button @click="addHead(2)" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }">H2</button>
    </el-tooltip>
    <el-tooltip content="Heading 3" placement="bottom">
      <button @click="addHead(3)" :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }">H3</button>
    </el-tooltip>

    <el-tooltip content="Code Block" placement="bottom">
      <button @click="toggleCode" :class="{ 'is-active': editor.isActive('codeBlock') }">
        Code
        <CodeIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="Undo" placement="bottom">
      <button @click="undo" :disabled="!editor.can().undo()">
        Undo
        <BackwardIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="Redo" placement="bottom">
      <button @click="redo" :disabled="!editor.can().redo()">
        Redo
        <ForwardIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="Toggle collaboration placeholder" placement="bottom">
      <button @click="emit('toggle-collaboration')" :class="{ 'is-active': isCollaborative }" :disabled="!canCollaborate">
        Collab
      </button>
    </el-tooltip>
  </div>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/vue-3'
import {
  BackwardIcon,
  CodeIcon,
  ComponentDividerVerticalIcon,
  ForwardIcon,
  ImageAddIcon,
  Link1Icon,
  LinkUnlinkIcon,
  ListIcon,
  OrderDescendingIcon,
  TaskChecked1Icon,
} from 'tdesign-icons-vue-next'

const { editor, canCollaborate, isCollaborative } = defineProps<{
  editor: Editor
  canCollaborate: boolean
  isCollaborative: boolean
}>()

const emit = defineEmits<{
  'toggle-collaboration': []
}>()

const addBulletList = () => editor.chain().focus().toggleBulletList().run()
const addOrderedList = () => editor.chain().focus().toggleOrderedList().run()
const addDivider = () => editor.chain().focus().setHorizontalRule().run()

const setLink = () => {
  const url = window.prompt('Enter a link')
  if (url) {
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    return
  }

  editor.chain().focus().extendMarkRange('link').unsetLink().run()
}

const unsetLink = () => editor.chain().focus().unsetLink().run()

const addImage = () => {
  const url = window.prompt('Enter an image URL')
  if (url) {
    editor.chain().focus().setImage({ src: url }).run()
  }
}

const addTask = () => editor.chain().focus().toggleTaskList().run()
const toggleCode = () => editor.chain().focus().toggleCodeBlock().run()
const addHead = (level: 1 | 2 | 3) => editor.chain().focus().toggleHeading({ level }).run()
const undo = () => editor.chain().focus().undo().run()
const redo = () => editor.chain().focus().redo().run()
</script>

<style lang="scss" scoped>
.toolbar {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

button {
  background-color: white;
  padding: 6px 10px;
  cursor: pointer;
  border-radius: 8px;
  transition: all 0.2s ease;
  border: 1px solid #d0d5dd;
  white-space: nowrap;
}

button.is-active {
  background-color: #1677ff;
  color: white;
  font-weight: bold;
  border-color: #1677ff;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.icon {
  margin-left: 4px;
}
</style>
