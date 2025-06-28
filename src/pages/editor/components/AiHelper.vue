<template>
  <!-- 自定义浮动层，替代 el-dialog -->
  <div
    ref="floatLayerRef"
    class="float-layer" 
    v-show="dialogVisible" 
    :class="{ 'show-animation': dialogVisible }"
    :style="{...floatStyle, width: floatWidth}"
  >
    <div class="float-content">
      <div class="title">AI助手</div>
      <div v-if="isLoading" class="loading-container">
        <div class="loading-spinner"></div>
        <span>生成中...</span>
      </div>
       <!-- 使用 v-html 渲染转换后的 HTML 内容 -->
      <p v-else class="text" v-html="renderedAiSummary"></p>
      <div class="actions">
        <button class="btn" @click="copyText" :disabled="isLoading">
          {{ isLoading ? '加载中...' : '复制' }}
        </button>
      </div>
    </div>
  </div>

  <!-- 手动触发对话框的按钮 -->
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
import { getAiSummary } from '@/api/editor';
import { marked } from 'marked';
import { ref, onMounted, type PropType, computed, onUnmounted, nextTick, watch, onUpdated } from 'vue';

// 定义组件属性
const props = defineProps({
  editor: {
    type: Object as PropType<any>,
    required: true,
  },
});

// 组件状态
const selectedText = ref(''); // 选中的内容
const aiSummary = ref('');    // AI生成的摘要
const dialogVisible = ref(false); // 对话框显示状态
const hasSelectedText = ref(false); // 是否有选中内容
const isLoading = ref(false);      // 加载状态
const isScrollDisabled = ref(false); // 滚动禁用状态
const scrollbarWidth = ref(0); // 滚动条宽度
const floatWidth = ref('200px'); // 浮动层宽度
const minFloatWidth = 300; // 浮动层最小宽度
const maxFloatWidth = 600; // 浮动层最大宽度
const floatLayerRef = ref<HTMLElement | null>(null); // 浮动层DOM引用

// 控制是否禁止滚轮滚动
const isFloatLayerVisible = computed(() => dialogVisible.value && !!aiSummary.value);

// 计算滚动条宽度
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

// 获取选中文本宽度
const getSelectedTextWidth = () => {
  if (!hasSelectedText.value) return minFloatWidth;
  
  // 创建临时元素计算文本宽度
  const tempDiv = document.createElement('div');
  tempDiv.style.position = 'absolute';
  tempDiv.style.visibility = 'hidden';
  tempDiv.style.whiteSpace = 'pre-wrap'; // 保留换行
  tempDiv.style.wordBreak = 'break-word'; // 允许单词换行
  tempDiv.style.font = '14px/1.4 "Helvetica Neue", Arial, sans-serif'; // 匹配正文样式
  tempDiv.textContent = selectedText.value;
  document.body.appendChild(tempDiv);
  
  // 获取文本宽度并添加适当的边距
  const textWidth = tempDiv.offsetWidth + 32; // 左右内边距16px*2
  document.body.removeChild(tempDiv);
  
  // 限制在最小和最大宽度之间
  return Math.min(Math.max(textWidth, minFloatWidth), maxFloatWidth) + 'px';
};

// 监听用户选中内容
const onSelectionUpdate = () => {
  const { state } = props.editor;
  const { from, to } = state.selection;

  if (from !== to) {
    const selectedTextContent = state.doc.textBetween(from, to);
    selectedText.value = selectedTextContent;
    hasSelectedText.value = true;
    aiSummary.value = ''; // 重置AI摘要
    dialogVisible.value = false; // 隐藏浮动层
  } else {
    selectedText.value = '';
    aiSummary.value = '';
    hasSelectedText.value = false;
    dialogVisible.value = false;
  }
};

// 计算浮动层位置（基于选中文本区域）
const floatStyle = computed(() => {
  if (!dialogVisible.value || !hasSelectedText.value || !floatLayerRef.value) return {};
  
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return {};
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // 创建调试用的 DOM
  const debugDiv = document.createElement('div');
  debugDiv.style.position = 'fixed';
  debugDiv.style.top = `${rect.top}px`;
  debugDiv.style.left = `${rect.left}px`;
  debugDiv.style.width = `${rect.width}px`;
  debugDiv.style.height = `${rect.height}px`;
  debugDiv.style.border = '2px dashed red';
  debugDiv.style.pointerEvents = 'none'; // 避免遮挡交互
  debugDiv.style.zIndex = String(99999);
  document.body.appendChild(debugDiv);

  // 测试完后移除（或定时移除）
  setTimeout(() => {
    debugDiv.remove();
  }, 3000);

  const floatLayerRect = floatLayerRef.value.getBoundingClientRect();
  
  // 计算理想顶部位置（选中文本下方，增加间距）
  let topPos = rect.top+rect.height+5; 
  
  // 计算选中文本高度，用于判断是否可能重叠
  const selectionHeight = rect.height;
  const floatLayerHeight = floatLayerRect.height;
  
  // 检查是否会覆盖选中文本或溢出视口底部
  if (topPos + floatLayerHeight > window.
  innerHeight || topPos < rect.top + selectionHeight) {
    // 如果会覆盖或溢出，显示在选中文本上方
    topPos = rect.top - floatLayerHeight - 15; // 上方增加15px间距
    
    // 确保不溢出视口顶部
    if (topPos < 0) {
      topPos = 10;
    }
  }

  return {
    left: `${rect.left}px`,
    top: `${topPos}px`,
    position: 'fixed',
    zIndex: 9999,
  };
})as any;

// 获取AI摘要并显示浮动层
const fetchAndShowSummary = async () => {
  if (!hasSelectedText.value || isLoading.value) return;
  
  isLoading.value = true;
  dialogVisible.value = true;
  
  try {
    // 显示加载状态
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

// 设置浮动层宽度
const setFloatWidth = () => {
  floatWidth.value = String(getSelectedTextWidth());
};

const updateFloatPosition = () => {
  if (!dialogVisible.value || !hasSelectedText.value || !floatLayerRef.value) return;

  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();
    if (rects.length === 0) return;

    // 获取第一行和最后一行的包围盒
    const firstLineRect = rects[0];
    const lastLineRect = rects[rects.length - 1];
    const floatLayerRect = floatLayerRef.value.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    
    // 计算下方空间：从最后一行底部到视口底部的距离
    const spaceBelow = viewportHeight - lastLineRect.bottom;
    
    // 计算上方空间：从第一行顶部到视口顶部的距离
    const spaceAbove = firstLineRect.top;
    
    // 浮动层高度（考虑间距）
    const requiredSpace = floatLayerRect.height + 10; // 额外间距
    
    let topPos: number;
    
    // 智能选择位置：优先下方，空间不足则上方
    if (spaceBelow >= requiredSpace) {
      // 下方空间充足，显示在最后一行下方
      topPos = lastLineRect.bottom + 5; // 下方间距
    } else if (spaceAbove >= requiredSpace) {
      // 上方空间充足，显示在第一行上方
      topPos = firstLineRect.top - floatLayerRect.height - 5; // 上方间距
    } else {
      // 上下空间都不足，优先显示在上方（可根据需求调整）
      topPos = 10; // 兜底贴顶
    }

    // 水平位置保持与选中文本对齐
    const leftPos = firstLineRect.left; // 使用第一行的左边界

    floatLayerRef.value.style.left = `${leftPos}px`;
    floatLayerRef.value.style.top = `${topPos}px`;
  }
};

// 关闭浮动层
const closeDialog = () => {
  dialogVisible.value = false;
  enableScroll();
};

// 复制文本
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

// 禁用滚动
const disableScroll = () => {
  isScrollDisabled.value = true;
  document.body.style.overflow = 'hidden';
  document.body.style.paddingRight = `${scrollbarWidth.value}px`;
};

// 启用滚动
const enableScroll = () => {
  isScrollDisabled.value = false;
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
};

// 初始化监听
onMounted(() => {
  calculateScrollbarWidth();
  props.editor.on('selectionUpdate', onSelectionUpdate);
  
  // 监听点击空白处隐藏浮动层
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

// 监听选中文本变化，更新浮动层宽度
watch(selectedText, () => {
  if (dialogVisible.value) {
    setFloatWidth();
  }
});

// 监听浮动层显示状态，同步滚动控制和宽度设置
watch(() => dialogVisible.value, (visible) => {
  if (visible) {
    disableScroll();
    setFloatWidth();
  } else {
    enableScroll();
  }
});

// 组件更新时更新位置（处理内容变化导致的位置偏移）
onUpdated(() => {
  if (dialogVisible.value) {
    updateFloatPosition();
  }
});

// 组件卸载时清理
onUnmounted(() => {
  props.editor.off('selectionUpdate', onSelectionUpdate);
  document.removeEventListener('click', closeDialog);
  enableScroll();
});

// 转换 Markdown 为 HTML
const renderedAiSummary = computed(() => {
  // 这里进行 Markdown 到 HTML 的转换
  return marked.parse(aiSummary.value);
});
</script>

<style lang="scss" scoped>
/* 基础样式 */
.float-layer {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  padding: 16px;
  box-sizing: border-box;
  min-width: 200px;
  opacity: 0;
  transform: translateY(8px);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  pointer-events: none;
  position: fixed;
  will-change: transform, opacity, left, top; /* 优化动画性能 */
}

.float-layer.show-animation {
  opacity: 1;
  transform: translateY(0);
  pointer-events: all;
}

/* 其他样式保持不变... */

.float-content {
  width: 100%;
  padding: 0px 16px; /* 新增，让内容与浮动层边框有间距 */
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

/* 按钮样式 */
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