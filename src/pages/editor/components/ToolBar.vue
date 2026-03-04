<template>
  <div class="toolbar">
    <el-tooltip content="Add Link" placement="bottom">
      <button type="button" @click="openLinkDialog">
        Link
        <Link1Icon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="Unset Link" placement="bottom">
      <button type="button" @click="unsetLink">
        Unlink
        <LinkUnlinkIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="Add Image" placement="bottom">
      <button type="button" @click="openImageDialog">
        Image
        <ImageAddIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="Task List" placement="bottom">
      <button type="button" @click="addTask" :class="{ 'is-active': editor.isActive('taskList') }">
        Task
        <TaskChecked1Icon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="Ordered List" placement="bottom">
      <button type="button" @click="addOrderedList" :class="{ 'is-active': editor.isActive('orderedList') }">
        Ordered
        <OrderDescendingIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="Unordered List" placement="bottom">
      <button type="button" @click="addBulletList" :class="{ 'is-active': editor.isActive('bulletList') }">
        Bullet
        <ListIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="Horizontal Rule" placement="bottom">
      <button type="button" @click="addDivider">
        Divider
        <ComponentDividerVerticalIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="Paragraph" placement="bottom">
      <button type="button" @click="setParagraph" :class="{ 'is-active': editor.isActive('paragraph') }">
        Text
      </button>
    </el-tooltip>

    <el-tooltip content="Heading 1" placement="bottom">
      <button type="button" @click="addHead(1)" :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }">H1</button>
    </el-tooltip>
    <el-tooltip content="Heading 2" placement="bottom">
      <button type="button" @click="addHead(2)" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }">H2</button>
    </el-tooltip>
    <el-tooltip content="Heading 3" placement="bottom">
      <button type="button" @click="addHead(3)" :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }">H3</button>
    </el-tooltip>

    <el-tooltip content="Code Block" placement="bottom">
      <button type="button" @click="toggleCode" :class="{ 'is-active': editor.isActive('codeBlock') }">
        Code
        <CodeIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="Clear Formatting" placement="bottom">
      <button type="button" @click="clearFormatting">
        Clear
      </button>
    </el-tooltip>

    <el-tooltip content="Undo" placement="bottom">
      <button type="button" @click="undo" :disabled="!editor.can().undo()">
        Undo
        <BackwardIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="Redo" placement="bottom">
      <button type="button" @click="redo" :disabled="!editor.can().redo()">
        Redo
        <ForwardIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="Toggle collaboration placeholder" placement="bottom">
      <button
        type="button"
        @click="emit('toggle-collaboration')"
        :class="{ 'is-active': isCollaborative }"
        :disabled="!canCollaborate"
      >
        Collab
      </button>
    </el-tooltip>
  </div>

  <el-dialog v-model="linkDialogVisible" title="Insert link" width="420px">
    <el-form label-position="top">
      <el-form-item label="URL">
        <el-input v-model="linkValue" placeholder="https://example.com" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="closeLinkDialog">Cancel</el-button>
      <el-button type="primary" @click="confirmLink">Apply</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="imageDialogVisible" title="Insert image" width="420px">
    <el-form label-position="top">
      <el-form-item label="Image URL">
        <el-input v-model="imageValue" placeholder="https://example.com/image.png" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="closeImageDialog">Cancel</el-button>
      <el-button type="primary" @click="confirmImage">Insert</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
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

const linkDialogVisible = ref(false)
const imageDialogVisible = ref(false)
const linkValue = ref('')
const imageValue = ref('')

const addBulletList = () => editor.chain().focus().toggleBulletList().run()
const addOrderedList = () => editor.chain().focus().toggleOrderedList().run()
const addDivider = () => editor.chain().focus().setHorizontalRule().run()
const unsetLink = () => editor.chain().focus().unsetLink().run()
const addTask = () => editor.chain().focus().toggleTaskList().run()
const setParagraph = () => editor.chain().focus().setParagraph().run()
const toggleCode = () => editor.chain().focus().toggleCodeBlock().run()
const addHead = (level: 1 | 2 | 3) => editor.chain().focus().toggleHeading({ level }).run()
const undo = () => editor.chain().focus().undo().run()
const redo = () => editor.chain().focus().redo().run()
const clearFormatting = () => editor.chain().focus().clearNodes().unsetAllMarks().run()

function openLinkDialog() {
  linkValue.value = editor.getAttributes('link').href || ''
  linkDialogVisible.value = true
}

function closeLinkDialog() {
  linkDialogVisible.value = false
  linkValue.value = ''
}

function confirmLink() {
  const url = linkValue.value.trim()
  if (!url) {
    editor.chain().focus().extendMarkRange('link').unsetLink().run()
    closeLinkDialog()
    return
  }

  if (!/^https?:\/\//i.test(url)) {
    ElMessage.warning('Please enter a valid URL that starts with http:// or https://')
    return
  }

  editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
  closeLinkDialog()
}

function openImageDialog() {
  imageValue.value = ''
  imageDialogVisible.value = true
}

function closeImageDialog() {
  imageDialogVisible.value = false
  imageValue.value = ''
}

function confirmImage() {
  const url = imageValue.value.trim()
  if (!/^https?:\/\//i.test(url)) {
    ElMessage.warning('Please enter a valid image URL that starts with http:// or https://')
    return
  }

  editor.chain().focus().setImage({ src: url }).run()
  closeImageDialog()
}
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
