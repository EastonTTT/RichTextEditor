<template>
  <div class="toolbar">
    <el-tooltip content="插入链接" placement="bottom">
      <button type="button" aria-label="插入链接" @click="openLinkDialog">
        <Link1Icon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="取消链接" placement="bottom">
      <button type="button" aria-label="取消链接" @click="unsetLink">
        <LinkUnlinkIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="插入图片" placement="bottom">
      <button type="button" aria-label="插入图片" @click="openImageDialog">
        <ImageAddIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="任务列表" placement="bottom">
      <button type="button" aria-label="任务列表" @click="addTask" :class="{ 'is-active': editor.isActive('taskList') }">
        <TaskChecked1Icon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="有序列表" placement="bottom">
      <button type="button" aria-label="有序列表" @click="addOrderedList" :class="{ 'is-active': editor.isActive('orderedList') }">
        <OrderDescendingIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="无序列表" placement="bottom">
      <button type="button" aria-label="无序列表" @click="addBulletList" :class="{ 'is-active': editor.isActive('bulletList') }">
        <ListIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="分割线" placement="bottom">
      <button type="button" aria-label="分割线" @click="addDivider">
        <ComponentDividerVerticalIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="正文段落" placement="bottom">
      <button type="button" aria-label="正文段落" @click="setParagraph" :class="{ 'is-active': editor.isActive('paragraph') }">
        <TextboxIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="一级标题" placement="bottom">
      <button type="button" class="label-button" @click="addHead(1)" :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }">H1</button>
    </el-tooltip>
    <el-tooltip content="二级标题" placement="bottom">
      <button type="button" class="label-button" @click="addHead(2)" :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }">H2</button>
    </el-tooltip>
    <el-tooltip content="三级标题" placement="bottom">
      <button type="button" class="label-button" @click="addHead(3)" :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }">H3</button>
    </el-tooltip>

    <el-tooltip content="代码块" placement="bottom">
      <button type="button" aria-label="代码块" @click="toggleCode" :class="{ 'is-active': editor.isActive('codeBlock') }">
        <CodeIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="清除格式" placement="bottom">
      <button type="button" aria-label="清除格式" @click="clearFormatting">
        <ClearFormatting1Icon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="撤销" placement="bottom">
      <button type="button" aria-label="撤销" @click="undo" :disabled="!editor.can().undo()">
        <BackwardIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="重做" placement="bottom">
      <button type="button" aria-label="重做" @click="redo" :disabled="!editor.can().redo()">
        <ForwardIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="共享文档才可启用协作" placement="bottom">
      <button
        type="button"
        @click="emit('toggle-collaboration')"
        :class="{ 'is-active': isCollaborative }"
        :disabled="!canCollaborate"
        aria-label="协同编辑"
      >
        <UsergroupIcon class="icon" />
      </button>
    </el-tooltip>
  </div>

  <el-dialog v-model="linkDialogVisible" title="插入链接" width="420px">
    <el-form label-position="top">
      <el-form-item label="链接地址">
        <el-input v-model="linkValue" placeholder="https://example.com" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="closeLinkDialog">取消</el-button>
      <el-button type="primary" @click="confirmLink">应用</el-button>
    </template>
  </el-dialog>

  <el-dialog v-model="imageDialogVisible" title="插入图片" width="420px">
    <el-form label-position="top">
      <el-form-item label="图片地址">
        <el-input v-model="imageValue" placeholder="https://example.com/image.png" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="closeImageDialog">取消</el-button>
      <el-button type="primary" @click="confirmImage">插入</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { Editor } from '@tiptap/vue-3'
import {
  BackwardIcon,
  ClearFormatting1Icon,
  CodeIcon,
  ComponentDividerVerticalIcon,
  ForwardIcon,
  ImageAddIcon,
  Link1Icon,
  LinkUnlinkIcon,
  ListIcon,
  OrderDescendingIcon,
  TaskChecked1Icon,
  TextboxIcon,
  UsergroupIcon,
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
    ElMessage.warning('请输入以 http:// 或 https:// 开头的有效链接。')
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
    ElMessage.warning('请输入以 http:// 或 https:// 开头的图片地址。')
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
  gap: 10px;
}

button {
  min-width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  cursor: pointer;
  border-radius: 14px;
  transition:
    transform 0.18s ease,
    box-shadow 0.18s ease,
    border-color 0.18s ease,
    background-color 0.18s ease;
  border: 1px solid #d0d5dd;
  box-shadow: 0 6px 14px rgba(15, 23, 42, 0.05);
}

button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #b7c4d6;
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08);
}

button.is-active {
  background: linear-gradient(135deg, #175ce6, #2f7bff);
  color: white;
  font-weight: bold;
  border-color: #175ce6;
  box-shadow: 0 12px 22px rgba(23, 92, 230, 0.22);
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
  box-shadow: none;
}

.label-button {
  min-width: 56px;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.01em;
}

.icon {
  font-size: 20px;
}
</style>
