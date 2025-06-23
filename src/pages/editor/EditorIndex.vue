<template>
  <div>
    <editor-header />
  </div>
  <div class="wrapper">
    <div class="toc-container">
      <table-of-contents :editor="editor!" class="toc" v-if="editor" />
    </div>
    <div class="editor-container">
      <rich-text-editor :editor="editor!" v-if="editor" @toggle-collaboration="toggleCollaboration" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import RichTextEditor from '@/pages/editor/components/RichTextEditor.vue';
import TableOfContents from '@/pages/editor/components/TableOfContents.vue';
import EditorHeader from './components/EditorHeader.vue';
import { basicExtensions } from '@/utils/editorExtensions'
import { useEditor } from '@tiptap/vue-3';
import '@/styles/editor.scss';
import * as Y from 'yjs'
import Collaboration from '@tiptap/extension-collaboration'
import { TiptapCollabProvider } from '@hocuspocus/provider'
import { reactive, ref, watchEffect, onMounted, onBeforeUnmount } from 'vue'
import { Editor } from '@tiptap/vue-3';
import { WebsocketProvider } from 'y-websocket'


// let provider: TiptapCollabProvider | null = null
// let editor = ref<Editor | {}>({})
//是否开启协作
const isCollaborative = ref(true)
//记录在线人数
const onlineUsers = ref(0)
//共享文档实例
const doc = new Y.Doc()
//创建协作服务
const provider = new WebsocketProvider('ws://119.29.83.248:8888/mydocument', 'mydocument', doc)

//文档名称
const documentName = 'demo'
const editor = useEditor({
  extensions: [
    ...basicExtensions,
    Collaboration.configure({
      document: doc,
    }),
  ],
  content: '<p>start collaborating!</p>',
})

//切换协作模式
// const toggleCollaboration = () => {
//   isCollaborative.value = !isCollaborative.value
//   console.log('协作状态变更:', isCollaborative.value)
// }

// watchEffect(() => {
//   if (isCollaborative.value && !provider) {
//     provider = new TiptapCollabProvider({
//       name: documentName,
//       baseUrl: 'http://localhost:8888/mydocument',
//       token: 'notoken',
//       document: doc,
//     })
//     console.log('创建协作服务:', provider)
//     // initEditor()
//   } else if (!isCollaborative.value && provider) {
//     provider.destroy()
//     provider = null
//     console.log('销毁协作服务:', provider)
//     // initEditor()
//   }
// })

//调试
provider.on('sync', ({ document }) => {
  console.log('🟢 Provider同步完成，连接成功')
})
provider.on('connect', () => console.log('✅ 连接建立'))
provider.on('disconnect', () => console.log('❌ 连接断开'))
doc.on('update', update => {
  console.log('✍️ Yjs 文档发生变更:', update)
})
provider.on('error', (err) => {
  console.error('❗ Provider 错误:', err)
})


onMounted(() => {
  // 监听协作模式切换
  console.log('协作模式:', isCollaborative.value)
})

onBeforeUnmount(() => {
  // 在组件销毁时清理 WebSocket 连接
  if (provider) {
    provider.destroy()
  }
})


</script>
<style lang="scss" scoped></style>
