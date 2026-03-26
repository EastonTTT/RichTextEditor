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
