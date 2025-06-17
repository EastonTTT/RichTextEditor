<template>
  <div>
    <bubble-menu :editor="editor!" v-if="editor" class="bubble-menu" :tippy-options="{ maxWidth: 'none' }">
      <div class="bubble-menu-container">
        <!-- 加粗 -->
        <button @click="toggleBold" :class="{ 'is-active': editor.isActive('bold') }">Bold
          <TextformatBoldIcon class="icon" />
        </button>
        <!-- 斜体 -->
        <button @click="toggleItalic" :class="{ 'is-active': editor.isActive('italic') }">Italic
          <TextformatItalicIcon class="icon" />
        </button>
        <!-- 删除线 -->
        <button @click="toggleStrike" :class="{ 'is-active': editor.isActive('strike') }">Strike
          <TextformatStrikethroughIcon class="icon" />
        </button>
        <!-- 下划线 -->
        <button @click="toggleUnderline" :class="{ 'is-active': editor.isActive('underline') }">Underline
          <TextformatUnderlineIcon class="icon" />
        </button>
        <!-- 文本高亮 -->
        <button @click="toggleHighlight" :class="{ 'is-active': editor.isActive('highlight') }">Highlight
          <Highlight1Icon class="icon" />
        </button>
        <!-- 文本样式 -->
        <button @click="editor.chain().focus().setTextAlign('left').run()"
          :class="{ 'is-active': editor.isActive({ textAlign: 'left' }) }">
          Left
          <FormatVerticalAlignLeftIcon class="icon" />
        </button>
        <button @click="editor.chain().focus().setTextAlign('center').run()"
          :class="{ 'is-active': editor.isActive({ textAlign: 'center' }) }">
          Center
          <FormatVerticalAlignCenterIcon class="icon" />
        </button>
        <button @click="editor.chain().focus().setTextAlign('right').run()"
          :class="{ 'is-active': editor.isActive({ textAlign: 'right' }) }">
          Right
          <FormatVerticalAlignRightIcon class="icon" />
        </button>

        <!-- 颜色修改 -->
        <div class="color-select">
          <label for="color">
            <TextformatColorIcon class="icon" />
            <input type="color" @input="editor.chain().focus().setColor($event.target?.value).run()"
              :value="editor.getAttributes('textStyle').color">
          </label>

        </div>

        <!-- 字号调整框 -->
        <select class="font-size-select" v-model="fontSize" @change="onFontSizeChange">
          <TextboxIcon class="icon" />
          <option disabled value="">字号</option>
          <option v-for="size in sizes" :key="size" :value="size">{{ size }}</option>
        </select>
      </div>
    </bubble-menu>
  </div>
</template>

<script lang="ts" setup>
import type { Editor } from '@tiptap/core';
import { BubbleMenu } from '@tiptap/vue-3';
import { sizes } from "@/constants/editor"
import { onMounted, ref } from 'vue';
import {
  FormatVerticalAlignCenterIcon,
  FormatVerticalAlignRightIcon,
  FormatVerticalAlignLeftIcon,
  TextformatBoldIcon,
  TextformatColorIcon,
  TextformatItalicIcon,
  TextformatStrikethroughIcon,
  TextformatUnderlineIcon,
  TextboxIcon,
  Highlight1Icon,
} from 'tdesign-icons-vue-next';

const { editor } = defineProps<{ editor: Editor | null }>()

const fontSize = ref('')

//加粗
const toggleBold = () => editor?.chain().focus().toggleBold().run()
//斜体
const toggleItalic = () => editor?.chain().focus().toggleItalic().run()
//删除线
const toggleStrike = () => editor?.chain().focus().toggleStrike().run()
//下划线
const toggleUnderline = () => editor?.chain().focus().toggleUnderline().run()

//修改字体大小
const onFontSizeChange = () => {
  const size = fontSize.value
  // console.log('size', size)
  editor?.chain().focus().setFontSize(size).run()
}

//文本高亮
const toggleHighlight = () => editor?.chain().focus().toggleHighlight().run()

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
/* BubbleMenu 整体容器样式 */
.bubble-menu {
  padding: 0;
  background: transparent;
  border: none;
  box-shadow: none;
}

/* 按钮样式 */
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

/* select 下拉框（字号） */
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

/* 颜色选择器 */
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
  background-color: #fff;
  padding: 8px 12px;
  gap: 6px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  align-items: center;
}
</style>
