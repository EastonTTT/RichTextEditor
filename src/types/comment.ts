// 声明编辑器使用的评论与评论线程数据结构。
export interface DocumentCommentItem {
  id: string
  authorId: string
  authorName: string
  content: string
  createdAt: string
}

export interface DocumentCommentThread {
  id: string
  excerpt: string
  createdAt: string
  updatedAt: string
  comments: DocumentCommentItem[]
}
