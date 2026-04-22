// 提供编辑器内搜索状态和匹配结果跳转能力。
import { ref, type Ref } from 'vue'
import type { Editor as CoreEditor } from '@tiptap/core'

export interface SearchMatch {
  from: number
  to: number
}

interface UseEditorSearchOptions {
  latestContentSnapshot: Ref<string>
  isHydrating: Ref<boolean>
  isBootstrappingCollaboration?: Ref<boolean>
  getEditor: () => CoreEditor | null
  onMarkDirty: () => void
}

export function useEditorSearch(options: UseEditorSearchOptions) {
  // 搜索和统计都依赖编辑器当前内容，放在同一个 composable 里便于统一刷新。
  const wordCount = ref(0)
  const characterCount = ref(0)
  const searchQuery = ref('')
  const searchMatches = ref<SearchMatch[]>([])
  const activeSearchIndex = ref(-1)

  function syncEditorStats(currentEditor: CoreEditor | null = options.getEditor()) {
    if (!currentEditor) {
      wordCount.value = 0
      characterCount.value = 0
      return
    }

    wordCount.value = currentEditor.storage.characterCount.words()
    characterCount.value = currentEditor.storage.characterCount.characters()
  }

  function refreshSearchMatches(currentEditor: CoreEditor | null = options.getEditor(), preserveIndex = false) {
    // 直接遍历 ProseMirror 文档节点，保证搜索结果和编辑器真实位置一致。
    const normalizedQuery = searchQuery.value.trim().toLowerCase()
    if (!currentEditor || normalizedQuery.length === 0) {
      searchMatches.value = []
      activeSearchIndex.value = -1
      return
    }

    const matches: SearchMatch[] = []

    currentEditor.state.doc.descendants((node, pos) => {
      if (!node.isText || !node.text) {
        return
      }

      const text = node.text.toLowerCase()
      let searchStart = 0

      while (true) {
        const foundIndex = text.indexOf(normalizedQuery, searchStart)
        if (foundIndex === -1) {
          break
        }

        const from = pos + foundIndex
        matches.push({
          from,
          to: from + normalizedQuery.length,
        })
        searchStart = foundIndex + normalizedQuery.length
      }
    })

    searchMatches.value = matches

    if (matches.length === 0) {
      activeSearchIndex.value = -1
      return
    }

    if (preserveIndex && activeSearchIndex.value >= 0 && activeSearchIndex.value < matches.length) {
      return
    }

    activeSearchIndex.value = 0
  }

  function focusSearchMatch(index: number) {
    const currentEditor = options.getEditor()
    const match = searchMatches.value[index]
    if (!currentEditor || !match) {
      return
    }

    activeSearchIndex.value = index
    currentEditor.chain().focus().setTextSelection({ from: match.from, to: match.to }).run()
  }

  function focusNextSearchMatch() {
    if (searchMatches.value.length === 0) {
      return
    }

    const nextIndex = activeSearchIndex.value < searchMatches.value.length - 1 ? activeSearchIndex.value + 1 : 0
    focusSearchMatch(nextIndex)
  }

  function focusPreviousSearchMatch() {
    if (searchMatches.value.length === 0) {
      return
    }

    const previousIndex = activeSearchIndex.value > 0 ? activeSearchIndex.value - 1 : searchMatches.value.length - 1
    focusSearchMatch(previousIndex)
  }

  function handleSearchChange(value: string) {
    searchQuery.value = value
    refreshSearchMatches()
  }

  function handleEditorUpdate(currentEditor: CoreEditor) {
    // setContent 等“回填动作”也会触发 update，这里用 hydrating 标记跳过二次保存。
    if (options.isHydrating.value || options.isBootstrappingCollaboration?.value) {
      return
    }

    options.latestContentSnapshot.value = currentEditor.getHTML()
    syncEditorStats(currentEditor)
    refreshSearchMatches(currentEditor, true)
    options.onMarkDirty()
  }

  function createBaseEditorOptions() {
    // 页面层与编辑器层的最小约定都从这里透出，便于本地/协同实例复用。
    return {
      onUpdate: ({ editor }: { editor: CoreEditor }) => {
        handleEditorUpdate(editor)
      },
      onCreate: ({ editor }: { editor: CoreEditor }) => {
        // 协同编辑器刚创建时，Yjs 房间内容还没首轮同步完成；
        // 如果此时编辑器还是空壳，不能反向把已有正文快照覆盖成空内容。
        if (!editor.isEmpty || !options.latestContentSnapshot.value || options.latestContentSnapshot.value === '<p></p>') {
          options.latestContentSnapshot.value = editor.getHTML()
        }
        syncEditorStats(editor)
        refreshSearchMatches(editor)
      },
    }
  }

  return {
    wordCount,
    characterCount,
    searchQuery,
    searchMatches,
    activeSearchIndex,
    syncEditorStats,
    refreshSearchMatches,
    focusNextSearchMatch,
    focusPreviousSearchMatch,
    handleSearchChange,
    createBaseEditorOptions,
  }
}
