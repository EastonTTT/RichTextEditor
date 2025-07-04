<template>
    <!-- 评论组件，传入配置并监听提交事件 -->
    <u-comment :config="config" @submit="submit">
    </u-comment>
    
    <!-- 加载动画，根据isLoading状态显示/隐藏 -->
    <Loading :visible="isLoading" message="加载中，请稍候..." />
    
    <!-- 没有更多数据提示，当hasMoreComment为false时显示 -->
    <div v-if="!hasMoreComment" class="no-more-data">
        已经到底了，没有更多数据了~
    </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import type { CommentApi, CommentSubmitApi, ConfigApi } from 'undraw-ui'
import { getCommentList, publishComment } from '@/api/comment';
import { ElMessage } from 'element-plus';
import Loading from './Loading.vue';
import { useUserStore } from '@/stores/user';
import { useRoute } from 'vue-router';

// 状态管理
const route = useRoute();
const isLoading = ref(false);  // 加载状态
const hasMoreComment = ref(false);  // 是否有更多评论
const text_id = Number(route.query.id); //当前访问的文档ID
// 新增：轮询相关变量
const pollInterval = ref<number | null>(null); // 轮询定时器ID
const pollTime = 5000; // 5秒轮询一次

// 评论组件配置
const config = reactive<ConfigApi>({
  user: {
    id: 0,
    username: '',
    avatar: ''
  }, // 当前用户信息
  comments: [], // 评论数据
  relativeTime: true, // 开启人性化时间显示
  replyShowSize: 10, // 回复显示数量
  page: true, // 开启分页
  show: {
    level: false,    // 关闭等级显示
    address: false, // 关闭地址信息
    likes: false    // 关闭点赞按钮显示
  },
})

// 评论提交处理函数
const submit = async ({content, parentId, finish }: CommentSubmitApi) => {
  // 构建发布评论的参数
  const publishcomment = {
    textId: text_id, //todo
    uid: useUserStore().userInfo.userId, 
    parentId: parentId,
    content: content,
  }

  // 调用发布评论API
  const publishresponse = (await publishComment(publishcomment)).data;
  
  // 构造需要回显的评论数据
  const comment: CommentApi = {
    id: publishresponse.data.id, // 评论ID
    parentId: parentId, // 父评论ID
    uid: useUserStore().userInfo.userId, // 当前用户ID
    content: content, // 评论内容
    createTime: publishresponse.data.createTime, // 发表时间
    user: {
      username: config.user.username,
      avatar: config.user.avatar,
    }, // 用户信息
    reply: null
  }

  // 延迟执行，模拟网络请求后更新评论列表并提示成功
  setTimeout(() => {
    finish(comment)
    ElMessage.success('评论成功')
  }, 200)
}

// 分页相关变量
let pageNum = 1  // 当前页数
let pageSize = 5  // 页大小
let total = 0  // 本次获取评论数量

// 获取评论列表函数
const fetchComment = async() => {
  isLoading.value = true
  try {

    // 设置当前用户信息到配置中
    const user = {
      id: useUserStore().userInfo.userId,
      username: useUserStore().userInfo.nickname,
      avatar: useUserStore().userInfo.avatar,
    }
    config.user = user;

    // 调用API获取评论数据
    const textId = text_id; //todo
    const res = (await getCommentList(textId, pageNum, pageSize)).data
    
    // 更新评论数据
    config.comments = res.data.list
    total = res.data.list.length

    // 判断是否还有更多数据
    if(total < pageSize) {
      hasMoreComment.value = false
    } else {
      hasMoreComment.value = true;
      pageNum++; // 页码加1，准备加载更多
    }
  } catch (error) {
    console.error("加载评论区失败", error);
  } finally {
    isLoading.value = false
  }  
}

// 加载更多评论函数
const fetchMoreComment = async() => {
  isLoading.value = true
  try {
    const textId = text_id; 
    const res = (await getCommentList(textId, pageNum, pageSize)).data
    
    // 追加新评论到现有列表
    config.comments.push(...res.data.list)
    total = res.data.list.length

    // 判断是否还有更多数据
    if(total < pageSize) {
      hasMoreComment.value = false
    } else {
      hasMoreComment.value = true;
      pageNum++; // 页码加1，准备加载更多
    }
  } catch (error) {
    console.error("加载更多失败", error);
  } finally {
    isLoading.value = false
  }  
}

// 滚动事件处理函数
const handleScroll = () => {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  // 当滚动到底部且有更多评论数据，并且当前没有在加载时，加载更多评论
  if (scrollTop + windowHeight >= documentHeight - 5 && hasMoreComment.value && !isLoading.value) {
    fetchMoreComment();
  }
};

// 启动轮询
const startPolling = () => {
  if (pollInterval.value) clearInterval(pollInterval.value);

  pollInterval.value = setInterval(async () => {
    try {
      // 单独请求第 1 页最新评论（不影响当前 pageNum）
      const textId = text_id;
      const res = (await getCommentList(textId, 1, pageSize)).data; 
      const latestComments = res.data.list;

      // 和现有评论合并（去重、置顶新评论）
      // 用 Set 去重（根据评论 id 判断）
      const existingIds = new Set(config.comments.map(item => item.id));
      const newComments = latestComments.filter((item: { id: string | number; }) => !existingIds.has(item.id));

      // 新评论插入到列表最前面
      config.comments.unshift(...newComments);
    } catch (error) {
      console.error("轮询获取最新评论失败", error);
    }
  }, pollTime);
};

// 停止轮询
const stopPolling = () => {
  if (pollInterval.value) {
    clearInterval(pollInterval.value);
    pollInterval.value = null;
  }
};

// 组件挂载时执行
onMounted(async () => {
  // 加载评论数据
  fetchComment();
  // 监听滚动事件
  window.addEventListener('scroll', handleScroll);
  // 启动轮询
  startPolling();
})

// 组件卸载前执行
onBeforeUnmount(() => {
  // 移除滚动事件监听，避免内存泄漏
  window.removeEventListener('scroll', handleScroll);
  stopPolling(); // 停止轮询
});
</script>

<style scoped>
.no-more-data {
  text-align: center;
  color: #888;
  font-size: 14px;
  margin-top: 20px;
}
</style>