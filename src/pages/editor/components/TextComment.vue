<template>
    <u-comment :config="config" @submit="submit" @beforeData="beforeData">
    </u-comment>
    <!-- 加载动画 -->
    <Loading :visible="isLoading" message="加载中，请稍候..." />
    <!-- 没有更多数据提示 -->
    <div v-if="!hasMoreComment" class="no-more-data">
        已经到底了，没有更多数据了~
      </div>
</template>

<script setup lang="ts">
import emoji from '@/assets/emoji'
import { onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import type { CommentApi, CommentSubmitApi, ConfigApi } from 'undraw-ui'
import { getMyInfo } from '@/api/user';
import { getCommentList, publishComment } from '@/api/blog';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import Loading from './Loading.vue';

const route = useRoute();
const isLoading= ref(false);  // 是否正在加载
const hasMoreComment = ref(false);  // 是否有更多评论
const isDraftType = ref(false);
//我的信息
const myInfo = ref({
  id: 0 as number,
  nickname: '' as string,
  avatar: '' as string
});
const config = reactive<ConfigApi>({
  user: {} as any, // 当前用户信息
  emoji: emoji, // 表情包数据
  comments: [], // 评论数据
  relativeTime: true, // 开启人性化时间
  replyShowSize: 10,
  page: true, // 开启分页
  show: {
    level: false,    // 关闭等级显示
    address: false, // 关闭地址信息
    likes: true    // 关闭点赞按钮显示
  },
})
function beforeData(data: any){
  // 处理数据,给所有的评论加上homeLink
  if(data.user.homeLink===null)
  {
    data.user.homeLink = '/personal/'+ data.uid
  }
}
// 提交评论事件
const submit = async ({ content, parentId, finish }: CommentSubmitApi) => {
  //发布评论
  const publishcomment={
    articleId: route.params.id,
    parentId: parentId,
    content: content,
  }

  const publishresponse = (await publishComment(publishcomment)).data;
  // 需要回显的评论
  const comment: CommentApi = {
    id: publishresponse.data.id,
    parentId: parentId,
    uid: myInfo.value.id,
    content: content,
    createTime: publishresponse.data.createTime,
    user: config.user,
    reply: null
  }

  setTimeout(() => {
    finish(comment)
    ElMessage.success('评论成功')
    // 重置评论框
  }, 200)
}
// 当前页数
let pageNum = 1
// 页大小
let pageSize = 5
// 本次获取评论数量
let total = 0
const fetchComment = async() => {
  isLoading.value = true
  try {
    //获取个人信息
  myInfo.value = (await getMyInfo()).data.data;
  config.user = {
    id: myInfo.value.id,
    username: myInfo.value.nickname,
    avatar: myInfo.value.avatar,
  } as any
  //获取评论区数据
  const blogId = Number( route.params.id);
  const res= (await getCommentList(blogId,pageNum,pageSize)).data
  config.comments = res.data.list
  total = res.data.list.length
  // 判断是否还有更多数据
  if(total<pageSize)
  { 
    hasMoreComment.value=false
  }
  else{
    hasMoreComment.value=true;
    pageNum++; // 页码加1
  }
  } catch (error) {
    console.error("加载评论区失败", error);
  }finally{
    isLoading.value=false
  }  
}

const fetchMoreComment = async() => {
  isLoading.value = true
  try {
  //获取更多评论区数据
  const blogId = Number( route.params.id);
  const res= (await getCommentList(blogId,pageNum,pageSize)).data
  config.comments.push(...res.data.list)
  total = res.data.list.length
  // 判断是否还有更多数据
  if(total<pageSize)
  { 
    hasMoreComment.value=false
  }
  else{
    hasMoreComment.value=true;
    pageNum++; // 页码加1
  }
  } catch (error) {
    console.error("加载更多失败", error);
  }finally{
    isLoading.value=false
  }  
}
// 监听页面滚动事件
const handleScroll = () => {
  const scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  // 如果滚动到底部且有更多评论数据，则加载更多评论
  if (scrollTop + windowHeight >= documentHeight - 5 && hasMoreComment.value && !isLoading.value) {
    fetchMoreComment();
  }
};

onMounted(async () => {
  //如果是草稿
  if ('type' in route.query) {
    // 草稿模式
    isDraftType.value = true;
    myInfo.value = (await getMyInfo()).data.data;
    config.user = {
      id: myInfo.value.id,
      username: myInfo.value.nickname,
      avatar: myInfo.value.avatar,
    } as any
  }
  else{
    //获取评论区数据
  fetchComment();
  // 监听滚动事件
  window.addEventListener('scroll', handleScroll);
  }
})
// 在组件卸载时移除滚动事件监听
onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
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
