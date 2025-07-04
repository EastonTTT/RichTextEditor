<template>
  <!-- 自定义浮动层：替代对话框，显示AI生成的摘要 -->
  <div
    ref="floatLayerRef"
    class="float-layer" 
    v-show="dialogVisible" 
    :class="{ 'show-animation': dialogVisible }"
    :style="{...floatStyle, width: floatWidth}"
  >
    <div class="float-content">
      <div class="title">AI助手</div>
      <!-- 加载状态显示 -->
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <span>生成中...</span>
      </div>
      <!-- 渲染AI生成的摘要（Markdown转HTML） -->
      <p v-else class="text" v-html="renderedAiSummary"></p>
      <!-- 操作按钮区 -->
      <div class="actions">
        <button class="btn" @click="copyText" :disabled="isLoading">
          {{ isLoading ? '加载中...' : '复制' }}
        </button>
      </div>
    </div>
  </div>

  <!-- AI功能触发按钮：固定在视口右侧，仅在有选中文本时显示 -->
  <button 
    @click="fetchAndShowSummary" 
    class="show-dialog-btn" 
    v-if="hasSelectedText"
    :disabled="isLoading"
    :style="{ position: 'fixed', right: '5px', top: '15%', transform: 'translateY(-50%)' }"
  >
    AI
  </button>
</template>

<script lang="ts" setup>
import { getAiSummary } from '@/api/editor';      // AI摘要接口
import { marked } from 'marked';                    // Markdown解析库
import { ref, onMounted, type PropType, computed, onUnmounted, nextTick, watch, onUpdated } from 'vue';

/**
 * 组件属性定义
 * - editor: 编辑器实例，用于获取选中文本
 */
const props = defineProps({
  editor: {
    type: Object as PropType<any>,
    required: true,
  },
});

/**
 * 组件状态管理
 * - selectedText: 选中文本内容
 * - aiSummary: AI生成的摘要
 * - dialogVisible: 浮动层显示状态
 * - hasSelectedText: 是否有选中文本
 * - isLoading: 加载状态
 * - 其他：浮动层位置和大小控制
 */
const selectedText = ref('');
const aiSummary = ref('');
const dialogVisible = ref(false);
const hasSelectedText = ref(false);
const isLoading = ref(false);
const isScrollDisabled = ref(false);
const scrollbarWidth = ref(0);
const floatWidth = ref('200px');
const minFloatWidth = 300;
const maxFloatWidth = 600;
const floatLayerRef = ref<HTMLElement | null>(null);

/**
 * 计算属性：浮动层是否可见
 * - 同时满足对话框显示且有AI摘要时为true
 */
const isFloatLayerVisible = computed(() => dialogVisible.value && !!aiSummary.value);

/**
 * 工具函数：计算滚动条宽度
 * - 用于在禁用滚动时保持页面布局稳定
 */
const calculateScrollbarWidth = () => {
  const div = document.createElement('div');
  div.style.overflow = 'scroll';
  div.style.visibility = 'hidden';
  div.style.position = 'absolute';
  div.style.width = '100px';
  div.style.height = '100px';
  document.body.appendChild(div);
  scrollbarWidth.value = div.offsetWidth - div.clientWidth;
  document.body.removeChild(div);
};

/**
 * 工具函数：获取选中文本对应的浮动层宽度
 * - 基于选中文本内容计算合适的宽度
 * - 限制最小和最大宽度
 * - 考虑视口宽度避免溢出
 */
const getSelectedTextWidth = () => {
  if (!hasSelectedText.value) return minFloatWidth;

  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.visibility = 'hidden';
  tempDiv.style.whiteSpace = 'pre-wrap';
  tempDiv.style.wordBreak = 'break-word';
  tempDiv.style.font = '14px/1.4 "Helvetica Neue", Arial, sans-serif';
  tempDiv.textContent = selectedText.value;
  document.body.appendChild(tempDiv);

  const textWidth = tempDiv.offsetWidth + 32;
  document.body.removeChild(tempDiv);

  const maxWidthFromViewport = window.innerWidth - 40; 
  const finalMaxWidth = Math.min(maxFloatWidth, maxWidthFromViewport);
  
  return Math.min(Math.max(textWidth, minFloatWidth), finalMaxWidth) + 'px';
};

/**
 * 事件监听：选中文本变化时更新状态
 * - 检测编辑器选中文本变化，更新选中内容状态
 */
const onSelectionUpdate = () => {
  const { state } = props.editor;
  const { from, to } = state.selection;

  if (from !== to) {
    const selectedTextContent = state.doc.textBetween(from, to);
    selectedText.value = selectedTextContent;
    hasSelectedText.value = true;
    aiSummary.value = '';
    dialogVisible.value = false;
  } else {
    selectedText.value = '';
    aiSummary.value = '';
    hasSelectedText.value = false;
    dialogVisible.value = false;
  }
};

/**
 * 计算属性：浮动层位置样式
 * - 基于选中文本位置计算浮动层的定位
 * - 包含调试用的选中文本区域标记
 */
const floatStyle = computed(() => {
  if (!dialogVisible.value || !hasSelectedText.value || !floatLayerRef.value) return {};
  
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return {};
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // 调试用：显示选中文本区域边界
  const debugDiv = document.createElement('div');
  debugDiv.style.position = 'fixed';
  debugDiv.style.top = `${rect.top}px`;
  debugDiv.style.left = `${rect.left}px`;
  debugDiv.style.width = `${rect.width}px`;
  debugDiv.style.height = `${rect.height}px`;
  debugDiv.style.border = '2px dashed red';
  debugDiv.style.pointerEvents = 'none';
  debugDiv.style.zIndex = String(99999);
  document.body.appendChild(debugDiv);

  // 3秒后移除调试标记
  setTimeout(() => {
    debugDiv.remove();
  }, 3000);

  const floatLayerRect = floatLayerRef.value.getBoundingClientRect();
  
  // 计算垂直位置（避免覆盖选中文本）
  let topPos = rect.top + rect.height + 5; 
  const selectionHeight = rect.height;
  const floatLayerHeight = floatLayerRect.height;
  
  if (topPos + floatLayerHeight > window.innerHeight || topPos < rect.top + selectionHeight) {
    topPos = rect.top - floatLayerHeight - 15;
    if (topPos < 0) topPos = 10;
  }

  return {
    left: `${rect.left}px`,
    top: `${topPos}px`,
    position: 'fixed',
    zIndex: 9999,
  };
}) as any;

/**
 * 核心功能：获取AI摘要并显示浮动层
 * - 校验选中文本和加载状态
 * - 调用AI接口生成摘要
 * - 处理响应数据并更新UI
 */
const fetchAndShowSummary = async () => {
  if (!hasSelectedText.value || isLoading.value) return;
  
  isLoading.value = true;
  dialogVisible.value = true;
  
  try {
    aiSummary.value = '';
    setFloatWidth();
    
    const response = await getAiSummary("要求返回的内容是纯文本，请精简解析下述内容，字数控制在200字左右:" + selectedText.value);
    console.log("后端返回的数据："+response.data);
    if (response && response.data) {
      aiSummary.value = response.data;
    } else {
      aiSummary.value = 'AI响应数据格式异常';
    }
    
    nextTick(() => {
      updateFloatPosition();
      setFloatWidth();
    });
  } catch (error) {
    console.error('获取AI摘要失败:', error);
    alert('获取AI摘要失败，请重试');
    aiSummary.value = '';
  } finally {
    isLoading.value = false;
  }
};

/**
 * 设置浮动层宽度
 * - 调用getSelectedTextWidth计算合适宽度
 */
const setFloatWidth = () => {
  floatWidth.value = String(getSelectedTextWidth());
};

/**
 * 更新浮动层位置
 * - 优化垂直和水平位置计算
 * - 处理视口边界情况
 */
const updateFloatPosition = () => {
  if (!dialogVisible.value || !hasSelectedText.value || !floatLayerRef.value) return;

  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();
    if (rects.length === 0) return;

    const firstLineRect = rects[0];
    const lastLineRect = rects[rects.length - 1];
    const floatLayerRect = floatLayerRef.value.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // 垂直位置计算
    const spaceBelow = viewportHeight - lastLineRect.bottom;
    const spaceAbove = firstLineRect.top;
    const requiredSpace = floatLayerRect.height + 10;
    let topPos: number;
    if (spaceBelow >= requiredSpace) {
      topPos = lastLineRect.bottom + 5;
    } else if (spaceAbove >= requiredSpace) {
      topPos = firstLineRect.top - floatLayerRect.height - 5;
    } else {
      topPos = 10;
    }

    // 水平位置计算（新增溢出处理）
    let leftPos = firstLineRect.left; 
    const floatLayerRight = leftPos + floatLayerRect.width; 
    if (floatLayerRight > viewportWidth) {
      const centerX = (firstLineRect.left + viewportWidth / 2) / 2; 
      leftPos = centerX - (floatLayerRect.width / 2);
      leftPos = Math.max(leftPos, 10); 
      leftPos = Math.min(leftPos, viewportWidth - floatLayerRect.width - 10);
    }

    floatLayerRef.value.style.left = `${leftPos}px`;
    floatLayerRef.value.style.top = `${topPos}px`;
  }
};

/**
 * 关闭浮动层
 * - 隐藏对话框并恢复页面滚动
 */
const closeDialog = () => {
  dialogVisible.value = false;
  enableScroll();
};

/**
 * 复制摘要文本
 * - 调用剪贴板API复制摘要内容
 */
const copyText = () => {
  if (isLoading.value) return;
  
  navigator.clipboard.writeText(aiSummary.value).then(() => {
    alert('复制成功');
    closeDialog();
  }).catch((error) => {
    console.error('复制失败:', error);
    alert('复制失败，请重试');
  });
};

/**
 * 滚动控制函数
 * - disableScroll: 禁用页面滚动并调整布局
 * - enableScroll: 恢复页面滚动
 */
const disableScroll = () => {
  isScrollDisabled.value = true;
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = `${scrollbarWidth.value}px`;
};

const enableScroll = () => {
  isScrollDisabled.value = false;
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
};

/**
 * 生命周期钩子
 * - onMounted: 初始化监听和配置
 * - onUnmounted: 清理资源和监听
 */
onMounted(() => {
  calculateScrollbarWidth();
  props.editor.on('selectionUpdate', onSelectionUpdate);
  
  // 点击空白处关闭浮动层
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (
      !target.closest('.float-layer') && 
      !target.closest('.show-dialog-btn')
    ) {
      closeDialog();
    }
  });
});

/**
 * 监听函数
 * - 选中文本变化时更新浮动层宽度
 * - 浮动层显示状态变化时控制页面滚动
 */
watch(selectedText, () => {
  if (dialogVisible.value) {
    setFloatWidth();
  }
});

watch(() => dialogVisible.value, (visible) => {
  if (visible) {
    disableScroll();
    setFloatWidth();
  } else {
    enableScroll();
  }
});

/**
 * 组件更新时钩子
 * - 确保内容变化时重新计算浮动层位置
 */
onUpdated(() => {
  if (dialogVisible.value) {
    updateFloatPosition();
  }
});

/**
 * 组件卸载钩子
 * - 清理监听和资源
 */
onUnmounted(() => {
  props.editor.off('selectionUpdate', onSelectionUpdate);
  document.removeEventListener('click', closeDialog);
  enableScroll();
});

/**
 * 计算属性：渲染AI摘要（Markdown转HTML）
 * - 使用marked库将Markdown格式的摘要转换为HTML
 */
const renderedAiSummary = computed(() => {
  return marked.parse(aiSummary.value);
});
</script>

<style lang="scss" scoped>
/* 基础样式：浮动层整体样式 */
.float-layer {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 16px;
  box-sizing: border-box;
  min-width: 200px;
  max-width: 100vw;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  position: fixed;
  will-change: transform, opacity, left, top;
}

.float-layer.show-animation {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
}

/* 浮动层内容区样式 */
.float-content {
  width: 100%;
  padding: 0px 16px;
}

.title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  color: #1f2937;
}

.text {
  margin-bottom: 16px;
  line-height: 1.5;
  color: #4b5563;
  word-break: break-word;
}

.loading-container {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  color: #6b7280;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #f3f4f6;
  border-top-color: #4f46e5;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
}

.actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.btn {
  padding: 6px 12px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #4b5563;
  
  &:hover:not(:disabled) {
    background-color: #f9fafb;
    border-color: #9ca3af;
  }
  
  &.primary {
    background: #4f46e5;
    color: white;
    border-color: #4f46e5;
    
    &:hover:not(:disabled) {
      background-color: #5b5cf6;
    }
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 触发按钮样式 */
.show-dialog-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #4f46e5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 14px;
  
  &:hover:not(:disabled) {
    background-color: #5b5cf6;
  }
  
  &:active:not(:disabled) {
    background-color: #4338ca;
  }
  
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
}
</style>