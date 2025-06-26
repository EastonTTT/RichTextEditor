<template>
  <div>
    <editor-header :editor="editor!" />
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
import { reactive, ref, watchEffect, onMounted, onBeforeUnmount, provide } from 'vue'
import { Editor } from '@tiptap/vue-3';
import { WebsocketProvider } from 'y-websocket'
import { useCollaborationProvider } from '@/utils/useCollaborationProvider';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import { useRoute } from 'vue-router';
import type { Role } from '@/types/editorTypes'

const route = useRoute()
// let provider: TiptapCollabProvider | null = null
// let editor = ref<Editor | {}>({})
//是否开启协作
const isCollaborative = ref(false)
//记录在线人数
const onlineUsers = ref(0)
//共享文档实例
const doc = new Y.Doc()

const documentName = 'demo'
const name = route.query.user as string || '匿名'
const color = route.query.color as string || '#29D587'
const role = route.query.role as Role || 'owner'

provide('isCollaborative', isCollaborative)
provide('role', role)
const user = {
  name,
  color
}
//创建协作服务
const {
  provider,
  awareness,
  connect,
  disconnect,
  destroy,
} = useCollaborationProvider({
  wsUrl: 'ws://119.29.83.248:8888/mydocument',
  roomName: documentName,
  doc: doc,
  user,
})
// const provider = new WebsocketProvider('ws://119.29.83.248:8888/mydocument', 'mydocument', doc)


//初始化编辑器
const editor = useEditor({
  // editable: role === 'owner',
  extensions: [
    ...basicExtensions,
    Collaboration.configure({
      document: doc,
    }),
    CollaborationCursor.configure({
      provider,
      user
    })
  ],
  content: '<p>start collaborating!</p>',
})

// 切换协作模式
const toggleCollaboration = () => {
  isCollaborative.value = !isCollaborative.value
  console.log('协作状态变更:', isCollaborative.value)
  if (isCollaborative.value) {
    connect()
    awareness.setLocalStateField('kickAll', null)
    console.log('协作服务开启')
  } else {
    disconnect()
    awareness.setLocalStateField('kickAll', true)
    console.log('协作服务关闭')
  }
}

//监听协作模式切换
awareness.on('change', ({ added, updated, removed }) => {
  const states = awareness.getStates()
  console.log('🧍 在线用户状态变化:', Array.from(states.values()))
  //获取所有连接的状态
  for (const state of states.values()) {
    if (state.kickAll === true) {
      provider.disconnect()
      editor.value?.setEditable(false)
      alert('协作已被关闭')
    }
  }
})


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
// doc.on('update', update => {
//   console.log('✍️ Yjs 文档发生变更:', update)
// })
provider.on('error', (err) => {
  console.error('❗ Provider 错误:', err)
})



onMounted(() => {
  // 监听协作模式切换
  console.log('协作模式:', isCollaborative.value)
})

onBeforeUnmount(() => {
  // 在组件销毁时清理 WebSocket 连接
  destroy()
})


</script>
<style lang="scss" scoped></style>
