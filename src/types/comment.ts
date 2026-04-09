// 评论以 thread 为容器，thread 里再按时间顺序保存 comment 列表。
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
