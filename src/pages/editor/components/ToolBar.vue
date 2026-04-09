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
      <button
        type="button"
        aria-label="有序列表"
        @click="addOrderedList"
        :class="{ 'is-active': editor.isActive('orderedList') }"
      >
        <OrderDescendingIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="无序列表" placement="bottom">
      <button
        type="button"
        aria-label="无序列表"
        @click="addBulletList"
        :class="{ 'is-active': editor.isActive('bulletList') }"
      >
        <ListIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="分隔线" placement="bottom">
      <button type="button" aria-label="分隔线" @click="addDivider">
        <ComponentDividerVerticalIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="正文段落" placement="bottom">
      <button type="button" aria-label="正文段落" @click="setParagraph" :class="{ 'is-active': editor.isActive('paragraph') }">
        <TextboxIcon class="icon" />
      </button>
    </el-tooltip>

    <el-tooltip content="一级标题" placement="bottom">
      <button
        type="button"
        class="label-button"
        @click="addHead(1)"
        :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
      >
        H1
      </button>
    </el-tooltip>

    <el-tooltip content="二级标题" placement="bottom">
      <button
        type="button"
        class="label-button"
        @click="addHead(2)"
        :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
      >
        H2
      </button>
    </el-tooltip>

    <el-tooltip content="三级标题" placement="bottom">
      <button
        type="button"
        class="label-button"
        @click="addHead(3)"
        :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
      >
        H3
      </button>
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

    <el-tooltip content="共享文档才可启用协同" placement="bottom">
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

  <el-dialog v-model="linkDialogVisible" title="插入链接" width="460px" destroy-on-close>
    <div class="dialog-body">
      <div class="dialog-intro">
        为当前选中文本添加跳转链接。若当前没有选中文本，系统会插入一段新的链接文本。
      </div>

      <el-form label-position="top" class="dialog-form">
        <el-form-item label="链接地址">
          <el-input v-model="linkValue" placeholder="https://example.com" />
        </el-form-item>

        <el-form-item label="显示文本">
          <el-input v-model="linkTextValue" placeholder="不填写时使用选中文本或链接地址" />
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeLinkDialog">取消</el-button>
        <el-button type="primary" @click="confirmLink">确定</el-button>
      </div>
    </template>
  </el-dialog>

  <el-dialog v-model="imageDialogVisible" title="插入图片" width="460px" destroy-on-close>
    <div class="dialog-body">
      <div class="dialog-intro">
        支持输入远程图片地址，或直接从本地选择图片插入到当前光标位置。
      </div>

      <el-form label-position="top" class="dialog-form">
        <el-form-item label="远程图片地址">
          <el-input v-model="imageValue" placeholder="https://example.com/image.png" />
        </el-form-item>

        <div class="dialog-divider">或</div>

        <div class="upload-card">
          <div class="upload-card__title">本地图片上传</div>
          <div class="upload-card__desc">支持常见图片格式，选择后会直接插入编辑器。</div>
          <div class="upload-row">
            <input
              ref="imageFileInput"
              class="hidden-file-input"
              type="file"
              accept="image/*"
              @change="handleImageFileChange"
            />
            <el-button @click="openLocalImagePicker">选择本地图片</el-button>
            <span class="upload-file-name">{{ imageFileName || '未选择文件' }}</span>
          </div>
        </div>
      </el-form>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="closeImageDialog">取消</el-button>
        <el-button type="primary" @click="confirmImage">确定</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
// 提供富文本编辑器主要的块级编辑操作。
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
const linkTextValue = ref('')
const imageValue = ref('')
const imageFileName = ref('')
const imageFileDataUrl = ref('')
const imageFileInput = ref<HTMLInputElement | null>(null)
const savedSelection = ref<{ from: number; to: number } | null>(null)

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

function captureSelection() {
  savedSelection.value = {
    from: editor.state.selection.from,
    to: editor.state.selection.to,
  }
}

function getSelectionText() {
  const selection = savedSelection.value
  if (!selection || selection.from === selection.to) {
    return ''
  }

  return editor.state.doc.textBetween(selection.from, selection.to, ' ').trim()
}

function openLinkDialog() {
  captureSelection()
  linkValue.value = editor.getAttributes('link').href || ''
  linkTextValue.value = getSelectionText()
  linkDialogVisible.value = true
}

function closeLinkDialog() {
  linkDialogVisible.value = false
  linkValue.value = ''
  linkTextValue.value = ''
}

function confirmLink() {
  const url = linkValue.value.trim()
  const selection = savedSelection.value || {
    from: editor.state.selection.from,
    to: editor.state.selection.to,
  }

  if (!url) {
    editor.chain().focus().setTextSelection(selection).extendMarkRange('link').unsetLink().run()
    closeLinkDialog()
    return
  }

  if (!/^https?:\/\//i.test(url)) {
    ElMessage.warning('请输入以 http:// 或 https:// 开头的有效链接。')
    return
  }

  const text = linkTextValue.value.trim()
  if (selection.from === selection.to) {
    editor
      .chain()
      .focus()
      .setTextSelection(selection)
      .insertContent({
        type: 'text',
        text: text || url,
        marks: [
          {
            type: 'link',
            attrs: { href: url },
          },
        ],
      })
      .run()
  } else {
    const chain = editor.chain().focus().setTextSelection(selection)
    if (text) {
      chain.insertContentAt(selection, {
        type: 'text',
        text,
        marks: [
          {
            type: 'link',
            attrs: { href: url },
          },
        ],
      })
    } else {
      chain.extendMarkRange('link').setLink({ href: url })
    }
    chain.run()
  }

  closeLinkDialog()
}

function openImageDialog() {
  captureSelection()
  imageValue.value = ''
  imageFileName.value = ''
  imageFileDataUrl.value = ''
  imageDialogVisible.value = true
}

function closeImageDialog() {
  imageDialogVisible.value = false
  imageValue.value = ''
  imageFileName.value = ''
  imageFileDataUrl.value = ''
  if (imageFileInput.value) {
    imageFileInput.value.value = ''
  }
}

function openLocalImagePicker() {
  imageFileInput.value?.click()
}

async function handleImageFileChange(event: Event) {
  const target = event.target as HTMLInputElement | null
  const file = target?.files?.[0]
  if (!file) {
    return
  }

  if (!file.type.startsWith('image/')) {
    ElMessage.warning('请选择图片文件。')
    target.value = ''
    return
  }

  imageFileName.value = file.name
  imageValue.value = ''

  imageFileDataUrl.value = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(reader.error || new Error('Failed to read image file'))
    reader.readAsDataURL(file)
  }).catch(() => '')

  if (!imageFileDataUrl.value) {
    imageFileName.value = ''
    target.value = ''
    ElMessage.error('读取图片失败。')
  }
}

function confirmImage() {
  const selection = savedSelection.value || {
    from: editor.state.selection.from,
    to: editor.state.selection.to,
  }
  const url = imageValue.value.trim()
  const src = imageFileDataUrl.value || url

  if (!src) {
    ElMessage.warning('请输入图片地址或选择本地图片。')
    return
  }

  if (!imageFileDataUrl.value && !/^https?:\/\//i.test(url)) {
    ElMessage.warning('请输入以 http:// 或 https:// 开头的图片地址，或直接上传本地图片。')
    return
  }

  editor
    .chain()
    .focus()
    .setTextSelection(selection)
    .setImage({
      src,
      alt: imageFileName.value || 'inserted image',
    })
    .run()

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
  color: #fff;
  font-weight: 700;
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

.dialog-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dialog-intro {
  padding: 14px 16px;
  border-radius: 14px;
  background: linear-gradient(180deg, #eef4ff 0%, #f8fbff 100%);
  color: #35518a;
  line-height: 1.7;
  font-size: 13px;
}

.dialog-form {
  padding: 18px 18px 4px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: linear-gradient(180deg, #fcfdff 0%, #ffffff 100%);
}

.dialog-divider {
  margin: 4px 0 16px;
  text-align: center;
  color: #667085;
  font-size: 12px;
}

.upload-card {
  padding: 14px;
  border: 1px dashed #bfd3ff;
  border-radius: 14px;
  background: #f7faff;
}

.upload-card__title {
  font-size: 13px;
  font-weight: 700;
  color: #1d2939;
}

.upload-card__desc {
  margin-top: 6px;
  color: #667085;
  font-size: 12px;
  line-height: 1.6;
}

.upload-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 12px;
}

.hidden-file-input {
  display: none;
}

.upload-file-name {
  color: #667085;
  font-size: 12px;
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

:deep(.el-dialog) {
  border-radius: 22px;
}

:deep(.el-dialog__header) {
  margin-right: 0;
  padding: 20px 22px 8px;
}

:deep(.el-dialog__body) {
  padding: 10px 22px 4px;
}

:deep(.el-dialog__footer) {
  padding: 0 22px 20px;
}

:deep(.dialog-form .el-form-item:last-child) {
  margin-bottom: 0;
}

:deep(.dialog-form .el-input__wrapper) {
  min-height: 42px;
  border-radius: 12px;
}
</style>
