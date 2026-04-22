<template>
  <el-drawer v-model="drawerVisible" title="文档评论" size="460px">
    <div class="comment-actions">
      <el-input
        :model-value="newCommentContent"
        type="textarea"
        :rows="4"
        resize="none"
        placeholder="写下这篇文档的讨论、问题或建议"
        @update:model-value="emit('update:newCommentContent', `${$event ?? ''}`)"
      />
      <div class="comment-toolbar">
        <span class="comment-summary">共 {{ commentCount }} 条评论</span>
        <div class="comment-toolbar-actions">
          <el-button :loading="isCommentsLoading" @click="emit('refresh')">刷新</el-button>
          <el-button type="primary" :loading="isCommentSubmitting" @click="emit('createComment')">发布评论</el-button>
        </div>
      </div>
    </div>

    <el-empty v-if="!commentThreads.length && !isCommentsLoading" description="还没有评论，先发第一条吧" />

    <div v-else class="comment-thread-list">
      <article v-for="thread in commentThreads" :key="thread.id" class="comment-thread-card">
        <div class="thread-comments">
          <div v-for="comment in thread.comments" :key="comment.id" class="comment-item">
            <div class="comment-meta">
              <div class="comment-meta-main">
                <strong>{{ comment.authorName }}</strong>
                <span>{{ formatCommentTime(comment.createdAt) }}</span>
              </div>
              <el-button
                v-if="canDeleteComments"
                size="small"
                text
                type="danger"
                :loading="isCommentSubmitting"
                @click="emit('deleteComment', thread.id, comment.id)"
              >
                删除
              </el-button>
            </div>
            <div class="comment-content">{{ comment.content }}</div>
          </div>
        </div>

        <div class="reply-box">
          <el-input
            :model-value="replyDrafts[thread.id] || ''"
            type="textarea"
            :rows="2"
            resize="none"
            placeholder="回复这个讨论"
            @update:model-value="emit('update:replyDraft', thread.id, `${$event ?? ''}`)"
          />
          <div class="reply-actions">
            <el-button size="small" :disabled="!(replyDrafts[thread.id] || '').trim()" @click="emit('clearReply', thread.id)">
              清空
            </el-button>
            <el-button
              size="small"
              type="primary"
              :loading="isCommentSubmitting"
              :disabled="!(replyDrafts[thread.id] || '').trim()"
              @click="emit('replyComment', thread.id)"
            >
              回复
            </el-button>
          </div>
        </div>
      </article>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DocumentCommentThread } from '@/types/comment'

const props = defineProps<{
  modelValue: boolean
  newCommentContent: string
  commentCount: number
  isCommentsLoading: boolean
  isCommentSubmitting: boolean
  canDeleteComments: boolean
  commentThreads: DocumentCommentThread[]
  replyDrafts: Record<string, string>
  formatCommentTime: (value: string) => string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'update:newCommentContent': [value: string]
  refresh: []
  createComment: []
  'update:replyDraft': [threadId: string, value: string]
  clearReply: [threadId: string]
  replyComment: [threadId: string]
  deleteComment: [threadId: string, commentId: string]
}>()

const drawerVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})
</script>

<style lang="scss" scoped>
.comment-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.comment-toolbar,
.comment-toolbar-actions,
.reply-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.comment-meta {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.comment-meta-main {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.comment-summary,
.comment-meta span {
  font-size: 12px;
  color: #667085;
}

.comment-thread-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.comment-thread-card {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 14px;
  background: linear-gradient(180deg, #f8fafc 0%, #ffffff 100%);
}

.thread-comments {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.comment-item {
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff;
  border: 1px solid #eaecf0;
}

.comment-meta {
  margin-bottom: 6px;
}

.comment-content {
  white-space: pre-wrap;
  line-height: 1.7;
  color: #344054;
}

.reply-box {
  margin-top: 12px;
}

.reply-actions {
  margin-top: 8px;
  justify-content: flex-end;
}
</style>
