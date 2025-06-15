<template>
  <div class="toc">
    <p>placeholder</p>
    <div v-for="heading in headings" :key="heading.id" @click="scrollToHeading(heading.pos)"
      :class="[`toc-item`, `level-${heading.level}`]">
      {{ heading.text }}
    </div>
    <!-- <TocItem v-for="item in headings" :key="item.id" :item="item" :editor="editor" /> -->
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
  // headings.value = buildTOCTree(result)
})

const scrollToHeading = (pos: number) => {
  const dom = editor?.view.nodeDOM(pos) as HTMLElement
  if (dom) {
    dom.scrollIntoView({ behavior: 'smooth' })
  }
}

// function buildTOCTree(flat: HeadingItem[]) {
//   const tree: HeadingItem[] = []
//   let lastH1: HeadingItem | null = null
//   let lastH2: HeadingItem | null = null

//   for (const item of flat) {
//     if (item.level === 1) {
//       tree.push({ ...item, children: [] })
//       lastH1 = tree[tree.length - 1]
//       lastH2 = null
//     } else if (item.level === 2 && lastH1) {
//       lastH1.children!.push({ ...item, children: [] })
//       lastH2 = lastH1.children![lastH1.children!.length - 1]
//     } else if (item.level === 3 && lastH2) {
//       lastH2.children!.push(item)
//     }
//   }

//   return tree
// }


</script>

<style lang="scss" setup></style>
