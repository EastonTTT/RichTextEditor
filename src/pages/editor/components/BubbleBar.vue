<template>
  <div>
    <bubble-menu :editor="editor" v-if="editor" class="bubble-menu" :tippy-options="{ maxWidth: 'none' }">
      <div class="bubble-menu-container">
        <button @click="toggleBold" :class="{ 'is-active': editor.isActive('bold') }">
          加粗
          <TextformatBoldIcon class="icon" />
        </button>
        <button @click="toggleItalic" :class="{ 'is-active': editor.isActive('italic') }">
          斜体
          <TextformatItalicIcon class="icon" />
        </button>
        <button @click="toggleStrike" :class="{ 'is-active': editor.isActive('strike') }">
          删除线
          <TextformatStrikethroughIcon class="icon" />
        </button>
        <button @click="toggleUnderline" :class="{ 'is-active': editor.isActive('underline') }">
          下划线
          <TextformatUnderlineIcon class="icon" />
        </button>
        <button @click="toggleHighlight" :class="{ 'is-active': editor.isActive('highlight') }">
          高亮
          <Highlight1Icon class="icon" />
        </button>
        <button
          @click="editor.chain().focus().setTextAlign('left').run()"
          :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }"
        >
          左对齐
          <FormatVerticalAlignLeftIcon class="icon" />
        </button>
        <button
          @click="editor.chain().focus().setTextAlign('center').run()"
          :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }"
        >
          居中
          <FormatVerticalAlignCenterIcon class="icon" />
        </button>
        <button
          @click="editor.chain().focus().setTextAlign('right').run()"
          :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }"
        >
          右对齐
          <FormatVerticalAlignRightIcon class="icon" />
        </button>

        <div class="color-select">
          <label>
            <TextformatColorIcon class="icon" />
            <input type="color" @input="onColorInput" :value="editor.getAttributes('textStyle').color" />
          </label>
        </div>

        <select class="font-size-select" v-model="fontSize" @change="onFontSizeChange">
          <option disabled value="">字号</option>
          <option v-for="size in sizes" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>
    </bubble-menu>
  </div>
</template>

<script lang="ts" setup>
// 为当前文本选区显示行内格式化工具。
import type { Editor } from '@tiptap/core'
import { BubbleMenu } from '@tiptap/vue-3'
import { sizes } from '@/constants/editor'
import { onBeforeUnmount, onMounted, ref } from 'vue'
import {
  FormatVerticalAlignCenterIcon,
  FormatVerticalAlignRightIcon,
  FormatVerticalAlignLeftIcon,
  TextformatBoldIcon,
  TextformatColorIcon,
  TextformatItalicIcon,
  TextformatStrikethroughIcon,
  TextformatUnderlineIcon,
  Highlight1Icon,
} from 'tdesign-icons-vue-next'

const { editor } = defineProps<{ editor: Editor | null }>()

// 气泡菜单只处理选中文本后的内联格式，不跟顶部工具栏重复职责。
const fontSize = ref('')
let stopSelectionListener: (() => void) | null = null

const toggleBold = () => editor?.chain().focus().toggleBold().run()
const toggleItalic = () => editor?.chain().focus().toggleItalic().run()
const toggleStrike = () => editor?.chain().focus().toggleStrike().run()
const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run()
const toggleHighlight = () => editor?.chain().focus().toggleHighlight().run()

function onFontSizeChange() {
  // 字号挂在 textStyle mark 上，因此直接调用自定义命令即可。
  if (!fontSize.value) {
    return
  }

  editor?.chain().focus().setFontSize(fontSize.value).run()
}

function onColorInput(event: Event) {
  const target = event.target as HTMLInputElement | null
  if (!target?.value) {
    return
  }

  editor?.chain().focus().setColor(target.value).run()
}

onMounted(() => {
  // 跟随选区同步当前字号，确保下拉框反映当前位置的文本样式。
  if (!editor) {
    return
  }

  const syncFontSize = () => {
    const currentFontSize = editor.getAttributes('textStyle').fontSize
    fontSize.value = sizes.includes(currentFontSize) ? currentFontSize : ''
  }

  syncFontSize()
  editor.on('selectionUpdate', syncFontSize)
  stopSelectionListener = () => editor.off('selectionUpdate', syncFontSize)
})

onBeforeUnmount(() => {
  stopSelectionListener?.()
})
</script>

<style lang="scss" scoped>
.bubble-menu {
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

button {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  font-size: 14px;
  background-color: white;
  border: 1px solid #ccc;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background-color: #f2f2f2;
  }

  &.is-active {
    background-color: #409eff;
    border-color: #409eff;
    color: white;
    font-weight: bold;
  }

  .icon {
    width: 16px;
    height: 16px;
  }
}

.font-size-select {
  padding: 2px 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background-color: white;
  height: 32px;
  cursor: pointer;

  &:hover {
    background-color: #f5f5f5;
  }
}

.color-select {
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 1px 5px;

  &:hover {
    background-color: #f5f5f5;
    border-radius: 4px;
  }

  label {
    display: flex;
    align-items: center;
    gap: 6px;
    cursor: pointer;

    input[type='color'] {
      width: 28px;
      height: 28px;
      border: none;
      background: none;
      cursor: pointer;
      padding: 0;
    }

    .icon {
      width: 16px;
      height: 16px;
    }
  }
}

.bubble-menu-container {
  display: flex;
  flex-wrap: wrap;
  background-color: #fff;
  padding: 8px 12px;
  gap: 6px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  align-items: center;
}
</style>
