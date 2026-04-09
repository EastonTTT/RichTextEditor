// 管理 AI 助手状态及文档级 AI 操作。
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { askDocumentAi } from '@/api/document'

interface UseDocumentAssistantOptions {
  documentId: string
  ensureSavedBeforeAction: () => Promise<void>
  getErrorMessage: (error: unknown, fallback: string) => string
}

export function useDocumentAssistant(options: UseDocumentAssistantOptions) {
  const isAssistantOpen = ref(false)
  const assistantQuestion = ref('')
  const assistantAnswer = ref('')
  const assistantLoading = ref(false)

  async function runAssistantSummary() {
    assistantLoading.value = true
    assistantAnswer.value = ''

    try {
      await options.ensureSavedBeforeAction()
      const result = await askDocumentAi(options.documentId, { mode: 'summary' })
      assistantAnswer.value = result.answer
    } catch (error) {
      ElMessage.error(options.getErrorMessage(error, 'AI 请求失败'))
    } finally {
      assistantLoading.value = false
    }
  }

  async function runAssistantQuestion() {
    if (!assistantQuestion.value.trim()) {
      ElMessage.warning('请输入问题后再提问。')
      return
    }

    assistantLoading.value = true
    assistantAnswer.value = ''

    try {
      await options.ensureSavedBeforeAction()
      const result = await askDocumentAi(options.documentId, {
        mode: 'question',
        prompt: assistantQuestion.value.trim(),
      })
      assistantAnswer.value = result.answer
    } catch (error) {
      ElMessage.error(options.getErrorMessage(error, 'AI 请求失败'))
    } finally {
      assistantLoading.value = false
    }
  }

  return {
    isAssistantOpen,
    assistantQuestion,
    assistantAnswer,
    assistantLoading,
    runAssistantSummary,
    runAssistantQuestion,
  }
}
