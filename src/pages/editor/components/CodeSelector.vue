<template>
  <div class="code-selector">
    <select v-model="selected">
      <option disabled value="">language</option>
      <option v-for="lang in codeLanguages" :key="lang.value" :value="lang.value" @change="onChange">
        {{ lang.label }}
      </option>>
    </select>
  </div>
</template>

<script lang="ts" setup>
import { codeLanguages } from "@/constants/editor"
import { ref, watch } from "vue"
import type { Editor } from "@tiptap/vue-3"
const { editor, currentLanguage } = defineProps<{ editor: Editor | null, currentLanguage: string }>()

const selected = ref(currentLanguage)
const onChange = () => {
  editor?.chain().focus().updateAttributes('codeBlock', {
    language: selected.value,
  }).run()
}

watch(() => selected.value, onChange)
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
