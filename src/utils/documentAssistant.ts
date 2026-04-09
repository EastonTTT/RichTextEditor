// 提供助手功能使用的本地文档文本分析方法。
export interface AssistantAnswer {
  answer: string
  references: string[]
}

// 这个工具是一个纯前端的轻量问答兜底，通过关键词匹配挑选相关段落。
function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim()
}

function splitIntoChunks(text: string) {
  // 按句号、问号、换行等边界切段，便于后续做最小粒度的相关性评分。
  return normalizeText(text)
    .split(/(?<=[。！？.!?])\s+|\n+/)
    .map((chunk) => chunk.trim())
    .filter((chunk) => chunk.length > 0)
}

function tokenize(value: string) {
  // 只保留较稳定的字母/数字词元，降低噪声字符对匹配结果的影响。
  return Array.from(new Set(value.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || []))
}

function scoreChunk(chunk: string, keywords: string[]) {
  if (keywords.length === 0) {
    return 0
  }

  const lowerChunk = chunk.toLowerCase()
  return keywords.reduce((score, keyword) => score + (lowerChunk.includes(keyword) ? 2 : 0), 0)
}

export function answerQuestionFromDocument(question: string, documentText: string): AssistantAnswer {
  // 如果没命中相关关键词，就退回文档前几段，至少给用户一个可读的上下文入口。
  const normalizedQuestion = normalizeText(question)
  const normalizedDocument = normalizeText(documentText)

  if (!normalizedQuestion) {
    return {
      answer: '请输入你想基于当前文档了解的问题。',
      references: [],
    }
  }

  if (!normalizedDocument) {
    return {
      answer: '当前文档没有可供分析的正文内容。',
      references: [],
    }
  }

  const keywords = tokenize(normalizedQuestion)
  const chunks = splitIntoChunks(documentText)
  const rankedChunks = chunks
    .map((chunk) => ({ chunk, score: scoreChunk(chunk, keywords) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.chunk.length - right.chunk.length)
    .slice(0, 3)
    .map((item) => item.chunk)

  const references = rankedChunks.length > 0 ? rankedChunks : chunks.slice(0, 3)
  const summaryLine =
    rankedChunks.length > 0
      ? '根据当前文档，最相关的内容集中在以下几段。'
      : '当前文档里没有找到与问题强相关的关键词，下面给出最靠前的正文片段供参考。'

  return {
    answer: `${summaryLine}\n\n${references.map((chunk, index) => `${index + 1}. ${chunk}`).join('\n')}`,
    references,
  }
}
