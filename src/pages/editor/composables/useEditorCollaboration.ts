// 跟踪共享文档的协同在线状态和连接状态。
import { nextTick, ref, shallowRef, type Ref } from 'vue'
import { createDocument as createPmDocument, getSchema, type Editor as CoreEditor } from '@tiptap/core'
import type { Schema } from '@tiptap/pm/model'
import { Editor } from '@tiptap/vue-3'
import * as Y from 'yjs'
import { prosemirrorToYXmlFragment } from 'y-prosemirror'
import { createEditorExtensions } from '@/utils/editorExtensions'
import { normalizeVisibility, setMetaValueIfChanged } from '@/utils/collaborationMeta'
import { useCollaborationProvider } from '@/utils/useCollaborationProvider'
import { getUserDisplayName, type UserProfile } from '@/types/user'
import type { DocumentDetail, DocumentVisibility } from '@/types/document'

export interface CollaboratorPresence {
  name: string
  color: string
}

type CollaborationRuntime = ReturnType<typeof useCollaborationProvider>

interface UseEditorCollaborationOptions {
  collabUrl?: string
  roomName: Ref<string>
  storedToken?: string
  storedUser: UserProfile
  canCollaborate: Ref<boolean>
  title: Ref<string>
  visibility: Ref<DocumentVisibility>
  latestContentSnapshot: Ref<string>
  collaborationEnabled: Ref<boolean>
  isHydrating: Ref<boolean>
  isBootstrappingCollaboration?: Ref<boolean>
  onMarkDirty: () => void
  onSyncEditorStats: (editor: CoreEditor | null) => void
  onRefreshSearchMatches: (editor: CoreEditor | null, preserveIndex?: boolean) => void
  createBaseEditorOptions: () => Record<string, unknown>
  onPermissionRevoked?: () => void
}

export function useEditorCollaboration(options: UseEditorCollaborationOptions) {
  // 这里同时维护编辑器实例、Yjs 文档和协同 provider，避免页面层过度耦合。
  const editorInstance = shallowRef<Editor | null>(null)
  const sharedDoc = shallowRef<Y.Doc | null>(null)
  const metaMap = shallowRef<Y.Map<unknown> | null>(null)
  const collaborationRuntime = shallowRef<CollaborationRuntime | null>(null)
  const isCollaborative = ref(false)
  const hasReceivedInitialSync = ref(false)
  const hasSeededCollaborationState = ref(false)
  const collaborators = ref<CollaboratorPresence[]>([])
  const suppressMetaObserver = ref(false)

  function readMetaIntoState() {
    const map = metaMap.value
    if (!map) {
      return
    }

    const nextTitle = map.get('title')
    const nextVisibility = map.get('visibility')

    if (typeof nextTitle === 'string' && nextTitle.trim()) {
      options.title.value = nextTitle
    }

    if (map.has('visibility')) {
      options.visibility.value = normalizeVisibility(nextVisibility)
    }
  }

  function syncStateIntoMeta() {
    // title / visibility 这类轻量元信息通过 Y.Map 单独同步，不混进正文 XML。
    const map = metaMap.value
    if (!map) {
      return
    }

    setMetaValueIfChanged(map, 'title', options.title.value)
    setMetaValueIfChanged(map, 'visibility', options.visibility.value)
  }

  function sharedDocumentHasMeaningfulContent(editor: Editor) {
    // 协同编辑器刚初始化时，底层 Y.XmlFragment 里可能已经有默认空段落；
    // 这里改用编辑器语义上的“是否为空文档”判断，避免把空壳房间误判成已有正文。
    return !editor.isEmpty
  }

  function setCollaborationBootstrapState(value: boolean) {
    if (options.isBootstrappingCollaboration) {
      options.isBootstrappingCollaboration.value = value
    }
  }

  function seedSharedDocumentContent(schema: Schema, snapshot = options.latestContentSnapshot.value) {
    const doc = sharedDoc.value
    if (!doc) {
      return
    }

    const fragment = doc.getXmlFragment('content')
    const pmDoc = createPmDocument(snapshot || '<p></p>', schema)
    prosemirrorToYXmlFragment(pmDoc, fragment)
  }

  function sharedMetaHasValues() {
    const map = metaMap.value
    if (!map) {
      return false
    }

    return map.has('title') || map.has('visibility')
  }

  function applyMetaObserver() {
    readMetaIntoState()

    if (!suppressMetaObserver.value && !options.isHydrating.value && hasSeededCollaborationState.value) {
      options.onMarkDirty()
    }
  }

  async function seedSharedDocumentFromSnapshot() {
    // 首次连上协同房间时，要么采用共享文档已有内容，要么用本地快照初始化房间。
    if (!options.canCollaborate.value || !hasReceivedInitialSync.value || hasSeededCollaborationState.value) {
      return
    }

    const currentEditor = editorInstance.value
    const map = metaMap.value
    if (!currentEditor || !map) {
      return
    }

    suppressMetaObserver.value = true

    if (sharedMetaHasValues()) {
      readMetaIntoState()
    } else {
      syncStateIntoMeta()
    }

    if (sharedDocumentHasMeaningfulContent(currentEditor)) {
      options.latestContentSnapshot.value = currentEditor.getHTML()
    } else {
      options.isHydrating.value = true
      seedSharedDocumentContent(currentEditor.schema)
      await nextTick()
      options.isHydrating.value = false
    }

    options.onSyncEditorStats(currentEditor)
    options.onRefreshSearchMatches(currentEditor)
    suppressMetaObserver.value = false
    hasSeededCollaborationState.value = true
    setCollaborationBootstrapState(false)
  }

  function syncCollaborators() {
    // awareness 可能包含重复或不完整状态，这里先做一次清洗再给 UI 展示。
    const runtime = collaborationRuntime.value
    if (!runtime || !isCollaborative.value || !options.canCollaborate.value) {
      collaborators.value = []
      return
    }

    const seen = new Set<string>()
    const nextCollaborators: CollaboratorPresence[] = []

    runtime.awareness.getStates().forEach((state: any) => {
      const user = state.user
      if (!user || typeof user.name !== 'string' || !user.name.trim()) {
        return
      }

      const entry = {
        name: user.name.trim(),
        color: typeof user.color === 'string' && user.color ? user.color : '#1677ff',
      }
      const key = `${entry.name}:${entry.color}`
      if (seen.has(key)) {
        return
      }

      seen.add(key)
      nextCollaborators.push(entry)
    })

    collaborators.value = nextCollaborators
  }

  function handleCollaborationStatus(event: { status: 'connected' | 'disconnected' | 'connecting' }) {
    if (!options.canCollaborate.value) {
      isCollaborative.value = false
      collaborators.value = []
      return
    }

    isCollaborative.value = event.status === 'connected'
    syncCollaborators()
  }

  function handleCollaborationSync(isSynced: boolean) {
    hasReceivedInitialSync.value = isSynced
    if (isSynced) {
      if (hasSeededCollaborationState.value) {
        setCollaborationBootstrapState(false)
        return
      }

      void seedSharedDocumentFromSnapshot()
      return
    }

    setCollaborationBootstrapState(true)
  }

  function handleConnectionClose(event: CloseEvent | null) {
    if (!options.canCollaborate.value) {
      return
    }

    if (event?.code === 4001 || event?.reason === 'permission-updated') {
      options.onPermissionRevoked?.()
    }
  }

  function detachCollaborationListeners() {
    // 切换文档模式或离开页面时，需要把 Yjs / provider 相关监听完整释放掉。
    metaMap.value?.unobserve(applyMetaObserver)

    if (collaborationRuntime.value) {
      collaborationRuntime.value.provider.off('status', handleCollaborationStatus)
      collaborationRuntime.value.provider.off('sync', handleCollaborationSync)
      collaborationRuntime.value.provider.off('connection-close', handleConnectionClose)
      collaborationRuntime.value.awareness.off('change', syncCollaborators)
      collaborationRuntime.value.destroy()
    }

    collaborationRuntime.value = null
    metaMap.value = null

    if (sharedDoc.value) {
      sharedDoc.value.destroy()
      sharedDoc.value = null
    }

    collaborators.value = []
    hasReceivedInitialSync.value = false
    hasSeededCollaborationState.value = false
    isCollaborative.value = false
    setCollaborationBootstrapState(false)
  }

  function destroyEditorSession() {
    detachCollaborationListeners()

    if (editorInstance.value) {
      editorInstance.value.destroy()
      editorInstance.value = null
    }
  }

  function createLocalEditor(content: string) {
    setCollaborationBootstrapState(false)
    editorInstance.value = new Editor({
      extensions: createEditorExtensions(),
      content: content || '<p></p>',
      ...options.createBaseEditorOptions(),
    })
  }

  function createCollaborativeSession(buildOptions: { seedFromSnapshot?: boolean } = {}) {
    // 协同模式下由远端文档驱动内容，不直接给初始 content，避免覆盖房间状态。
    if (!options.collabUrl) {
      createLocalEditor(options.latestContentSnapshot.value)
      return
    }

    const doc = new Y.Doc()
    const runtime = useCollaborationProvider({
      wsUrl: options.collabUrl,
      roomName: options.roomName.value,
      doc,
      token: options.storedToken,
      user: {
        name: getUserDisplayName(options.storedUser),
        color: options.storedUser.color,
      },
      autoConnect: false,
    })
    const meta = doc.getMap<unknown>('meta')

    sharedDoc.value = doc
    collaborationRuntime.value = runtime
    metaMap.value = meta
    options.collaborationEnabled.value = true
    setCollaborationBootstrapState(true)

    if (buildOptions.seedFromSnapshot) {
      // 私有文档首次切入共享时，后端会清空旧 room state；
      // 这里要先把刚保存的正文写进新的 Yjs 房间，再让协同编辑器接管。
      seedSharedDocumentContent(getBaseSchema())
      syncStateIntoMeta()
      hasSeededCollaborationState.value = true
      hasReceivedInitialSync.value = true
    }

    runtime.provider.on('status', handleCollaborationStatus)
    runtime.provider.on('sync', handleCollaborationSync)
    runtime.provider.on('connection-close', handleConnectionClose)
    runtime.awareness.on('change', syncCollaborators)
    meta.observe(applyMetaObserver)

    editorInstance.value = new Editor({
      extensions: createEditorExtensions({
        ydoc: doc,
        collaborationProvider: runtime.provider,
        collaborationUser: runtime.user,
      }),
      content: undefined,
      ...options.createBaseEditorOptions(),
    })

    runtime.connect()
  }

  async function rebuildEditorSession(
    document: Pick<DocumentDetail, 'content' | 'title' | 'visibility'>,
    buildOptions: {
      forceLocal?: boolean
      seedCollaborationFromSnapshot?: boolean
    } = {},
  ) {
    // 文档可见性变化时，本地/协同编辑器的扩展集合会变化，因此直接重建实例更稳妥。
    options.latestContentSnapshot.value = document.content || '<p></p>'
    destroyEditorSession()
    await nextTick()

    if (!buildOptions.forceLocal && document.visibility === 'shared' && options.collabUrl) {
      createCollaborativeSession({ seedFromSnapshot: buildOptions.seedCollaborationFromSnapshot })
      return
    }

    createLocalEditor(options.latestContentSnapshot.value)
  }

  function syncTitleToMeta(value: string) {
    if (metaMap.value && hasReceivedInitialSync.value) {
      setMetaValueIfChanged(metaMap.value, 'title', value)
    }
  }

  function syncVisibilityToMeta(value: DocumentVisibility) {
    if (metaMap.value && hasReceivedInitialSync.value) {
      setMetaValueIfChanged(metaMap.value, 'visibility', value)
    }
  }

  function getBaseSchema() {
    return editorInstance.value?.schema ?? getSchema(createEditorExtensions())
  }

  function toggleCollaboration() {
    // 这里只控制连接状态，不改变文档的共享属性。
    const runtime = collaborationRuntime.value
    if (!runtime || !options.canCollaborate.value) {
      return
    }

    options.collaborationEnabled.value = !options.collaborationEnabled.value

    if (options.collaborationEnabled.value) {
      runtime.connect()
      return
    }

    runtime.disconnect()
    isCollaborative.value = false
    collaborators.value = []
  }

  return {
    editorInstance,
    sharedDoc,
    metaMap,
    collaborationRuntime,
    isCollaborative,
    hasReceivedInitialSync,
    hasSeededCollaborationState,
    collaborators,
    suppressMetaObserver,
    destroyEditorSession,
    rebuildEditorSession,
    syncStateIntoMeta,
    toggleCollaboration,
    syncTitleToMeta,
    syncVisibilityToMeta,
  }
}
