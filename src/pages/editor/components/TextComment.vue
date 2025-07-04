<template>
  <!-- 评论组件：绑定配置 & 提交事件 -->
  <u-comment :config="config" @submit="submit"></u-comment>
  
  <!-- 加载状态反馈 -->
  <Loading :visible="isLoading" message="加载中，请稍候..." />
  
  <!-- 分页兜底提示 -->
  <div v-if="!hasMoreComment" class="no-more-data">
    已经到底了，没有更多数据了~
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import type { CommentApi, CommentSubmitApi, ConfigApi } from 'undraw-ui'
import { getCommentList, publishComment } from '@/api/comment'   // 接口请求
import { ElMessage } from 'element-plus'                         // 消息提示
import Loading from './Loading.vue'                              // 加载组件
import { useUserStore } from '@/stores/user'                     // 用户状态
import { useRoute } from 'vue-router'                            // 路由信息
import DOMPurify from 'dompurify'                                // HTML净化库

/** 
 * 安全配置区 
 */
const SECURITY_CONFIG = {
  MAX_COMMENT_LENGTH: 1000,                   // 最大评论长度
  COMMENT_TAGS_WHITELIST: ['p', 'br', 'a', 'strong', 'em', 'u', 's'], // 允许的HTML标签
  COMMENT_ATTRS_WHITELIST: ['href', 'target'] // 允许的HTML属性
}

/** 
 * 状态管理区 
 *  - 路由/加载/分页/轮询等核心状态
 */
const route = useRoute()                     // 路由实例
const isLoading = ref(false)                 // 全局加载状态
const hasMoreComment = ref(false)            // 分页控制：是否还有更多评论
const text_id = Number(route.query.id)       // 当前文档ID（从路由参数获取）

// 轮询控制
const pollInterval = ref<number | null>(null) // 定时器ID
const pollTime = 3000                          // 轮询间隔（3秒）

/** 
 * 安全工具函数 
 */
// 净化HTML内容，防止XSS攻击
const sanitizeHtml = (html: string) => {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: SECURITY_CONFIG.COMMENT_TAGS_WHITELIST,
    ALLOWED_ATTR: SECURITY_CONFIG.COMMENT_ATTRS_WHITELIST,
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'input'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick']
  })
}

// 验证评论内容安全性
const validateComment = (content: string) => {
  // 长度验证
  if (content.length > SECURITY_CONFIG.MAX_COMMENT_LENGTH) {
    return { valid: false, message: `评论长度不能超过${SECURITY_CONFIG.MAX_COMMENT_LENGTH}字符` }
  }
  
  // 敏感词验证（示例）
  const sensitiveWords = ['攻击', '恶意', '病毒', '<script']
  const hasSensitiveWord = sensitiveWords.some(word => content.includes(word))
  if (hasSensitiveWord) {
    return { valid: false, message: '评论包含敏感词汇，请修改后提交' }
  }
  
  return { valid: true }
}

/** 
 * 评论组件配置区 
 *  - 包含用户信息、评论列表、功能开关等
 */
const config = reactive<ConfigApi>({
  user: { id: 0, username: '', avatar: '' }, // 当前登录用户信息（初始空值）
  comments: [],                               // 评论数据存储
  relativeTime: true,                         // 人性化时间显示（例如“1小时前”）
  replyShowSize: 10,                          // 折叠回复时显示数量
  page: true,                                 // 启用组件内置分页
  show: {                                     // 功能开关
    level: false,    // 隐藏等级标识
    address: false,  // 隐藏地址信息
    likes: false     // 隐藏点赞按钮
  }
})

/** 
 * 评论提交逻辑 
 *  - 处理发布评论的异步流程
 */
const submit = async ({ content, parentId, finish }: CommentSubmitApi) => {
  // 1. 客户端验证
  const validation = validateComment(content)
  if (!validation.valid) {
    ElMessage.error(validation.message)
    return
  }
  
  // 2. 净化HTML内容
  const cleanContent = sanitizeHtml(content)
  
  // 3. 构造请求参数
  const publishcomment = {
    textId: text_id,
    uid: useUserStore().userInfo.userId, // 当前用户ID（从Pinia获取）
    parentId,                            // 父评论ID（回复场景使用）
    content: cleanContent                // 净化后的评论内容
  }

  // 4. 调用发布接口
  try {
    const publishresponse = (await publishComment(publishcomment)).data

    // 5. 构造回显的评论数据（需符合CommentApi结构）
    const comment: CommentApi = {
      id: publishresponse.data.id,         // 接口返回的评论ID
      parentId,                            // 父评论ID
      uid: useUserStore().userInfo.userId, // 当前用户ID
      content: cleanContent,              // 使用净化后的内容
      createTime: publishresponse.data.createTime, // 发布时间
      user: {                              // 当前用户信息
        username: config.user.username,
        avatar: config.user.avatar
      },
      reply: null                          // 回复内容（初始空）
    }

    // 6. 更新UI & 提示成功
    finish(comment)         // 通知组件更新评论列表
    ElMessage.success('评论成功') // 成功反馈
  } catch (error: any) {
    ElMessage.error(error.message || '发布评论失败')
  }
}

/** 
 * 分页加载逻辑 
 *  - 初始加载 & 滚动加载更多
 */
let pageNum = 1    // 当前页码（从第1页开始）
let pageSize = 5   // 每页条数
let total = 0      // 本次请求返回的评论数量

// 初始加载评论列表
const fetchComment = async () => {
  isLoading.value = true
  try {
    // 1. 设置当前用户信息到配置
    const user = {
      id: useUserStore().userInfo.userId,
      username: useUserStore().userInfo.nickname,
      avatar: useUserStore().userInfo.avatar
    }
    config.user = user

    // 2. 调用列表接口
    const textId = text_id
    const res = (await getCommentList(textId, pageNum, pageSize)).data

     // 3. 净化并更新评论数据
    const sanitizedComments = res.data.list.map((comment: any) => ({
      ...comment,
      content: sanitizeHtml(comment.content) // 净化评论内容
    }))

    config.comments = res.data.list
    total = res.data.list.length

    // 判断是否还有更多数据（通过返回条数是否等于页大小）
    hasMoreComment.value = total >= pageSize
    if (hasMoreComment.value) pageNum++ // 准备下一次加载更多
  } catch (error) {
    console.error("加载评论区失败", error)
    ElMessage.error('加载评论失败')
  } finally {
    isLoading.value = false
  }
}

// 滚动加载更多
const fetchMoreComment = async () => {
  isLoading.value = true
  try {
    const textId = text_id
    const res = (await getCommentList(textId, pageNum, pageSize)).data

    // 净化并追加新评论
    const sanitizedComments = res.data.list.map((comment: any) => ({
      ...comment,
      content: sanitizeHtml(comment.content) // 净化评论内容
    }))

    config.comments.push(...sanitizedComments)
    total = res.data.list.length

    // 更新分页状态
    hasMoreComment.value = total >= pageSize
    if (hasMoreComment.value) pageNum++
  } catch (error) {
    console.error("加载更多失败", error)
    ElMessage.error('加载更多评论失败')
  } finally {
    isLoading.value = false
  }
}

/** 
 * 滚动监听逻辑 
 *  - 监听页面滚动，触发加载更多
 */
const handleScroll = () => {
  // 计算滚动位置
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight

  // 触底判断：滚动条距离底部 < 5px 时触发加载
  const isNearBottom = scrollTop + windowHeight >= documentHeight - 5
  
  // 触发条件：触底 + 有更多数据 + 不在加载中
  if (isNearBottom && hasMoreComment.value && !isLoading.value) {
    fetchMoreComment()
  }
}

/** 
 * 轮询逻辑 
 *  - 定时拉取最新评论（第1页），保持实时性
 */
const startPolling = () => {
  // 防止重复启动定时器
  if (pollInterval.value) clearInterval(pollInterval.value)

  pollInterval.value = setInterval(async () => {
    try {
      const textId = text_id
      // 固定请求第1页数据（获取最新评论）
      const res = (await getCommentList(textId, 1, pageSize)).data
      const latestComments = res.data.list

      // 净化最新评论
      const sanitizedComments = latestComments.map((comment: any) => ({
        ...comment,
        content: sanitizeHtml(comment.content) // 净化评论内容
      }))

      // 去重逻辑：通过评论ID过滤已有数据
      const existingIds = new Set(config.comments.map(item => item.id))
      const newComments = latestComments.filter(
        (item: { id: string | number }) => !existingIds.has(item.id)
      )

      // 新评论置顶（插入列表最前面）
      config.comments.unshift(...newComments)
    } catch (error) {
      console.error("轮询获取最新评论失败", error)
    }
  }, pollTime)
}

// 停止轮询（组件卸载时调用）
const stopPolling = () => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value)
    pollInterval.value = null
  }
}

/** 
 * 生命周期 
 *  - 挂载时初始化，卸载时清理副作用
 */
onMounted(async () => {
  // 1. 初始加载评论
  await fetchComment()
  
  // 2. 监听滚动事件（触底加载）
  window.addEventListener('scroll', handleScroll)
  
  // 3. 启动轮询（保持最新评论）
  startPolling()
})

onBeforeUnmount(() => {
  // 清理滚动监听 & 轮询定时器
  window.removeEventListener('scroll', handleScroll)
  stopPolling()
})
</script>

<style scoped>
.no-more-data {
  text-align: center;
  color: #888;
  font-size: 14px;
  margin-top: 20px;
}
</style>