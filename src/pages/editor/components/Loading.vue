<template>
    <div v-if="visible" class="loading-inline">
      <i class="iconfont icon-third-loading"></i>
      <span>{{ message }}</span>
    </div>
  </template>
  
  <script setup>
  /**
   * Props:
   * - `visible` (Boolean): 控制加载动画的显示或隐藏
   * - `message` (String): 加载动画旁边显示的文字，默认值为 "加载中..."
   */
  defineProps({
    visible: {
      type: Boolean,
      required: true,
    },
    message: {
      type: String,
      default: "加载中...",
    },
  });
  </script>
  
  <style scoped>
  .loading-inline {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 1rem 0; /* 上下内边距 */
    color: #666;
  }
  
  .loading-inline i {
    font-size: 30px; /* 图标大小 */
    color: #007bff; /* 主色调 */
    margin-right: 10px;
    animation: rotate 1.5s linear infinite; /* 旋转动画 */
  }
  
  .loading-inline span {
    font-size: 1rem;
  }
  
  /* 图标旋转动画 */
  @keyframes rotate {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
  </style>
  