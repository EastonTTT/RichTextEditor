// 跟踪共享文档的协同在线状态和连接状态。
import { nextTick, ref, shallowRef, type Ref } from 'vue'
import type { Editor as CoreEditor } from '@tiptap/core'
import { Editor } from '@tiptap/vue-3'
import * as Y from 'yjs'
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
  onMarkDirty: () => void
  onSyncEditorStats: (editor: CoreEditor | null) => void
  onRefreshSearchMatches: (editor: CoreEditor | null, preserveIndex?: boolean) => void
  createBaseEditorOptions: () => Record<string, unknown>
}

export function useEditorCollaboration(options: UseEditorCollaborationOptions) {
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
    const map = metaMap.value
    if (!map) {
      return
    }

    setMetaValueIfChanged(map, 'title', options.title.value)
    setMetaValueIfChanged(map, 'visibility', options.visibility.value)
  }

  function sharedDocumentHasContent() {
    return Boolean(sharedDoc.value && sharedDoc.value.getXmlFragment('content').length > 0)
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

    if (sharedDocumentHasContent()) {
      options.latestContentSnapshot.value = currentEditor.getHTML()
    } else {
      options.isHydrating.value = true
      currentEditor.commands.setContent(options.latestContentSnapshot.value || '<p></p>', false)
      await nextTick()
      options.isHydrating.value = false
    }

    options.onSyncEditorStats(currentEditor)
    options.onRefreshSearchMatches(currentEditor)
    suppressMetaObserver.value = false
    hasSeededCollaborationState.value = true
  }

  function syncCollaborators() {
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
      void seedSharedDocumentFromSnapshot()
    }
  }

  function detachCollaborationListeners() {
    metaMap.value?.unobserve(applyMetaObserver)

    if (collaborationRuntime.value) {
      collaborationRuntime.value.provider.off('status', handleCollaborationStatus)
      collaborationRuntime.value.provider.off('sync', handleCollaborationSync)
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
  }

  function destroyEditorSession() {
    detachCollaborationListeners()

    if (editorInstance.value) {
      editorInstance.value.destroy()
      editorInstance.value = null
    }
  }

  function createLocalEditor(content: string) {
    editorInstance.value = new Editor({
      extensions: createEditorExtensions(),
      content: content || '<p></p>',
      ...options.createBaseEditorOptions(),
    })
  }

  function createCollaborativeSession() {
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

    runtime.provider.on('status', handleCollaborationStatus)
    runtime.provider.on('sync', handleCollaborationSync)
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
    } = {},
  ) {
    options.latestContentSnapshot.value = document.content || '<p></p>'
    destroyEditorSession()
    await nextTick()

    if (!buildOptions.forceLocal && document.visibility === 'shared' && options.collabUrl) {
      createCollaborativeSession()
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

  function toggleCollaboration() {
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
