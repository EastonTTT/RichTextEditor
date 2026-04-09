<template>
  <div class="code-selector">
    <select v-model="selected">
      <option disabled value="">选择语言</option>
      <option v-for="lang in codeLanguages" :key="lang.value" :value="lang.value">
        {{ lang.label }}
      </option>
    </select>
  </div>
</template>

<script lang="ts" setup>
// 允许用户切换当前代码块的语言。
import { codeLanguages } from '@/constants/editor'
import { ref, watch } from 'vue'
import type { Editor } from '@tiptap/vue-3'

const { editor, currentLanguage } = defineProps<{ editor: Editor | null; currentLanguage: string }>()

// 语言选择器本身只维护一个本地 selected，再同步到 codeBlock attributes。
const selected = ref(currentLanguage)
const onChange = () => {
  editor
    ?.chain()
    .focus()
    .updateAttributes('codeBlock', {
      language: selected.value,
    })
    .run()
}

watch(() => selected.value, onChange)
watch(() => currentLanguage, (value) => {
  // 当外部编辑器选区切到其它代码块时，需要反向更新下拉框显示。
  selected.value = value
})
</script>

<style lang="scss" scoped>
.code-selector {
  position: absolute;
  background-color: #2d2d2d;
  padding: 4px 8px;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
}

.code-selector select {
  background: #2d2d2d;
  color: #fff;
  border: none;
  outline: none;
  margin: 5px;
}
</style>
