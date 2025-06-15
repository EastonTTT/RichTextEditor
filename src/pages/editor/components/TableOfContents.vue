<template>
  <div class="toc">
    <p>placeholder...</p>
    <div v-for="heading in headings" :key="heading.id" @click="scrollToHeading(heading.pos)" class="toc-item">
      {{ heading.text }}
    </div>

  </div>
</template>
<script lang="ts" setup>
import { watchEffect, ref } from 'vue'
import { Editor } from '@tiptap/vue-3';
import type { HeadingItem } from '@/types/extensionTypes'

const { editor } = defineProps<{ editor: Editor | null }>()
const headings = ref<HeadingItem[]>([])

watchEffect(() => {
  if (!editor) return
  const result: HeadingItem[] = []

  editor.state.doc.descendants((node, pos) => {
    if (node.type.name === 'heading') {
      const level = node.attrs.level
      const text = node.textContent
      const id = `heading-${pos}`

      result.push({ level, text, id, pos })
    }
  })

  headings.value = result
})

const scrollToHeading = (pos: number) => {
  const dom = editor?.view.domAtPos(pos).node as HTMLElement
  if (dom) {
    dom.scrollIntoView({ behavior: 'smooth' })
  }
}



</script>

<style lang="scss" setup></style>
