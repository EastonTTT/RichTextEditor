<template>
  <div v-if="visible" class="loading-container">
    <i class="iconfont icon-third-loading"></i>
    <span>{{ message }}</span>
  </div>
</template>

<script setup lang="ts">
// 导入 defineProps 类型
import { defineProps } from 'vue';

/**
 * 加载动画组件
 * 
 * Props:
 * - visible (Boolean): 控制组件显示/隐藏
 * - message (String): 加载提示文字，默认"加载中..."
 */
const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  message: {
    type: String,
    default: '加载中...',
  },
});
</script>

<style scoped>
/* 加载组件容器 */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem 0;
  color: #666;
}

/* 加载图标样式 */
.loading-container i {
  font-size: 1.875rem; /* 30px */
  color: #007bff;
  margin-right: 0.625rem; /* 10px */
  animation: rotate 1.5s linear infinite;
}

/* 加载文字样式 */
.loading-container span {
  font-size: 1rem;
}

/* 旋转动画定义 */
@keyframes rotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>