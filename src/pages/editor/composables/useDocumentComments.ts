// 管理编辑器评论线程、回复草稿与轮询状态。
import { computed, ref, type Ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteDocumentComment, getDocumentCommentThreads, updateDocumentCommentThreads } from '@/api/comment'
import type { DocumentCommentItem, DocumentCommentThread } from '@/types/comment'
import { getUserDisplayName, type UserProfile } from '@/types/user'

interface UseDocumentCommentsOptions {
  documentId: string
  currentUser: Pick<UserProfile, 'id' | 'name' | 'nickname'>
  isOwner: Ref<boolean>
  getErrorMessage: (error: unknown, fallback: string) => string
}

export function useDocumentComments(options: UseDocumentCommentsOptions) {
  // 评论以整组 thread 为单位拉取和提交，保证楼层结构始终来自同一份后端数据。
  const commentThreads = ref<DocumentCommentThread[]>([])
  const isCommentsLoading = ref(false)
  const isCommentSubmitting = ref(false)
  const newCommentContent = ref('')
  const replyDrafts = ref<Record<string, string>>({})
  const commentCount = computed(() => commentThreads.value.reduce((total, thread) => total + thread.comments.length, 0))

  let commentsPollTimer: number | null = null

  function createRuntimeId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  }

  function formatCommentTime(value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return value
    }

    return date.toLocaleString()
  }

  function normalizeCommentContent(value: string) {
    return value.replace(/\r\n/g, '\n').trim()
  }

  function buildThreadExcerpt(content: string) {
    return normalizeCommentContent(content).replace(/\s+/g, ' ').slice(0, 60)
  }

  function updateReplyDraft(threadId: string, value: string) {
    replyDrafts.value = {
      ...replyDrafts.value,
      [threadId]: value,
    }
  }

  function clearReplyDraft(threadId: string) {
    if (!(threadId in replyDrafts.value)) {
      return
    }

    const nextDrafts = { ...replyDrafts.value }
    delete nextDrafts[threadId]
    replyDrafts.value = nextDrafts
  }

  async function loadCommentThreads(showError = true) {
    isCommentsLoading.value = true
    try {
      commentThreads.value = await getDocumentCommentThreads(options.documentId)
    } catch (error) {
      if (showError) {
        ElMessage.error(options.getErrorMessage(error, '评论加载失败'))
      }
    } finally {
      isCommentsLoading.value = false
    }
  }

  async function persistCommentThreads(
    updater: (threads: DocumentCommentThread[]) => DocumentCommentThread[],
    successMessage: string,
  ) {
    // 提交前先拉最新线程，尽量减少多人同时评论时互相覆盖的概率。
    isCommentSubmitting.value = true
    try {
      const latestThreads = await getDocumentCommentThreads(options.documentId)
      const nextThreads = updater(latestThreads)
      commentThreads.value = await updateDocumentCommentThreads(options.documentId, nextThreads)
      ElMessage.success(successMessage)
    } catch (error) {
      ElMessage.error(options.getErrorMessage(error, '评论保存失败'))
    } finally {
      isCommentSubmitting.value = false
    }
  }

  async function handleCreateComment() {
    const content = normalizeCommentContent(newCommentContent.value)
    if (!content) {
      ElMessage.warning('请输入评论内容。')
      return
    }

    await persistCommentThreads(
      (threads) => {
        const createdAt = new Date().toISOString()
        const comment: DocumentCommentItem = {
          id: createRuntimeId('comment'),
          authorId: options.currentUser.id,
          authorName: getUserDisplayName(options.currentUser),
          content,
          createdAt,
        }

        return [
          {
            id: createRuntimeId('thread'),
            excerpt: buildThreadExcerpt(content),
            createdAt,
            updatedAt: createdAt,
            comments: [comment],
          },
          ...threads,
        ]
      },
      '评论已发布',
    )

    newCommentContent.value = ''
  }

  async function handleReplyComment(threadId: string) {
    const content = normalizeCommentContent(replyDrafts.value[threadId] || '')
    if (!content) {
      ElMessage.warning('请输入回复内容。')
      return
    }

    await persistCommentThreads(
      (threads) =>
        threads.map((thread) => {
          if (thread.id !== threadId) {
            return thread
          }

          const createdAt = new Date().toISOString()
          const comment: DocumentCommentItem = {
            id: createRuntimeId('comment'),
            authorId: options.currentUser.id,
            authorName: getUserDisplayName(options.currentUser),
            content,
            createdAt,
          }

          return {
            ...thread,
            excerpt: thread.excerpt || buildThreadExcerpt(thread.comments[0]?.content || content),
            updatedAt: createdAt,
            comments: [...thread.comments, comment],
          }
        }),
      '回复已发布',
    )

    clearReplyDraft(threadId)
  }

  async function handleDeleteComment(threadId: string, commentId: string) {
    if (!options.isOwner.value) {
      ElMessage.warning('只有文档所有者可以删除评论。')
      return
    }

    try {
      await ElMessageBox.confirm('删除后将无法恢复这条评论，是否继续？', '删除评论', {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      })
    } catch {
      return
    }

    isCommentSubmitting.value = true
    try {
      commentThreads.value = await deleteDocumentComment(options.documentId, threadId, commentId)
      clearReplyDraft(threadId)
      ElMessage.success('评论已删除。')
    } catch (error) {
      ElMessage.error(options.getErrorMessage(error, '删除评论失败'))
    } finally {
      isCommentSubmitting.value = false
    }
  }

  function stopCommentsPolling() {
    if (commentsPollTimer) {
      window.clearInterval(commentsPollTimer)
      commentsPollTimer = null
    }
  }

  function startCommentsPolling(isCommentsOpen: Ref<boolean>) {
    // 抽屉打开时才轮询，避免无意义请求持续占用网络。
    stopCommentsPolling()
    commentsPollTimer = window.setInterval(() => {
      if (!isCommentsOpen.value || isCommentSubmitting.value) {
        return
      }

      void loadCommentThreads(false)
    }, 5000)
  }

  return {
    commentThreads,
    isCommentsLoading,
    isCommentSubmitting,
    newCommentContent,
    replyDrafts,
    commentCount,
    formatCommentTime,
    updateReplyDraft,
    clearReplyDraft,
    loadCommentThreads,
    handleCreateComment,
    handleReplyComment,
    handleDeleteComment,
    startCommentsPolling,
    stopCommentsPolling,
  }
}
