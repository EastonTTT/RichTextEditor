<template>
  <!-- 按钮过渡组：控制 AI 速览按钮的渐显渐隐动画 -->
  <transition-group name="btn-fade" tag="div" class="toggle-btn-container">
    <button 
      v-if="!visible && mode === 'read'" 
      @click="showComponent" 
      class="ai-toggle-btn"
      key="btn"
    >
      <el-icon class="toggle-icon"><Lightning /></el-icon>
      <span>AI速览</span>
    </button>
  </transition-group>

  <!-- 组件过渡：控制 AI 速览容器的出场入场动画 -->
  <transition name="component-fade" mode="out-in">
    <div class="ai-overview-container" v-show="visible && mode === 'read'">
      <!-- 头部区域：包含标题和操作按钮 -->
      <div class="ai-overview-header">
        <h3 class="ai-title">AI速览</h3>
        <div class="ai-actions">
          <!-- 生成/刷新摘要按钮 -->
          <button @click="refreshSummary" class="action-btn" :class="{ 'loading-btn': loading }">
            <el-icon v-if="!loading" class="action-icon"><Refresh /></el-icon>
            <el-icon v-else class="action-icon spin-icon"><Loading /></el-icon>
            <span>{{ loading ? '生成中...' : '总结' }}</span>
          </button>

          <!-- 展开/收起按钮 -->
          <button @click="toggleShowMore" class="action-btn">
            <el-icon class="action-icon" :class="{ 'rotate-icon': showMore }">
              <template v-if="showMore">
                <CaretTop />
              </template>
              <template v-else>
                <CaretRight />
              </template>
            </el-icon>
            <span>{{ showMore ? '收起' : '展开' }}</span>
          </button>

          <!-- 复制按钮 -->
          <button @click="copySummary" class="action-btn" :class="{ 'copied': copySuccess }">
            <el-icon v-if="!copySuccess" class="action-icon"><DocumentCopy /></el-icon>
            <el-icon v-else class="action-icon copied-icon"><Check /></el-icon>
            <span>{{ copySuccess ? '已复制' : '复制' }}</span>
          </button>

          <!-- 关闭按钮 -->
          <button @click="toggleVisibility" class="action-btn">
            <el-icon class="action-icon"><Close /></el-icon>
            <span>关闭</span>
          </button>
        </div>
      </div>

      <!-- 加载状态：生成摘要时显示 -->
      <div v-if="loading" class="ai-overview-loading">
        <div class="spinner"></div>
        <p class="loading-text">正在生成摘要...</p>
      </div>

      <!-- 错误状态：生成失败时显示 -->
      <div v-else-if="error" class="ai-overview-error">
        <el-icon class="error-icon"><CircleClose /></el-icon>
        <p class="error-text">{{ error }}</p>
      </div>

      <!-- 内容区域：正常状态下显示摘要 -->
      <div v-else class="ai-overview-content">
        <div 
          class="summary-content"
          :class="{ 'expanded': showMore, 'collapsed-text': !showMore }"
        >
          <!-- 内容为空提示 -->
          <div v-if="!summary && !truncatedSummary" class="default-tip">
            <p>暂无摘要内容，点击"总结"按钮生成摘要</p>
          </div>

          <!-- 渲染摘要内容（完整/截断） -->
          <div v-else v-html="showMore ? summary : truncatedSummary"></div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import type { Editor } from '@tiptap/vue-3';
import { marked } from 'marked'; // Markdown 转 HTML 工具
import DOMPurify from 'dompurify'; // HTML 净化工具（防 XSS）
// Element Plus 图标
import { 
  Refresh, Loading, CaretRight, CaretTop,
  DocumentCopy, Check, Close, CircleClose, Lightning 
} from '@element-plus/icons-vue';
import '@/styles/summary.scss'; // 组件专属样式
import { getAiSummary } from '@/api/editor'; // 生成摘要的接口

/**
 * 接收父组件参数
 * - editor：编辑器实例，用于获取文档内容
 * - mode：当前模式（仅在 'read' 模式下显示 AI 速览）
 */
const { editor, mode } = defineProps<{
  editor: Editor | null;
  mode: string;
}>();

/**
 * Markdown 解析配置
 * - gfm：启用 GitHub 风格的 Markdown 语法
 * - breaks：支持换行符转换为 <br>
 */
marked.setOptions({
  gfm: true,        
  breaks: true,     
});

/**
 * 组件状态管理
 * - visible：控制 AI 速览容器的显示/隐藏
 * - showMore：控制摘要内容的展开/收起
 * - loading：生成摘要时的加载状态
 * - error：生成失败时的错误信息
 * - summary：存储完整的摘要内容（HTML 格式）
 * - truncatedSummary：存储截断后的摘要内容（HTML 格式）
 * - copySuccess：复制操作的成功状态
 */
const visible = ref(false);
const showMore = ref(false);
const loading = ref(false);
const error = ref('');
const summary = ref('');
const truncatedSummary = ref('');
const copySuccess = ref(false);

/**
 * 显示 AI 速览容器
 * - 修改 visible 状态，触发过渡动画
 */
const showComponent = () => {
  visible.value = true;
};

/**
 * 核心逻辑：生成文档摘要
 * 1. 校验编辑器实例是否存在
 * 2. 开启加载状态，清空错误信息
 * 3. 获取编辑器内容（带格式的 HTML）
 * 4. 调用 AI 接口生成摘要（Markdown 格式）
 * 5. 将 Markdown 转换为安全的 HTML
 * 6. 生成截断后的摘要，重置展开状态
 */
const generateSummary = async () => {
  if (!editor) {
    error.value = '编辑器实例不存在';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    // 获取编辑器内容（带 HTML 格式）
    const documentContent = editor.getHTML();
    // 拼接提示词，引导 AI 生成摘要
    const description = "请简要为下面这篇文档内容做个总结,总结可以掺杂一些emoji(控制在300字左右，采用尽量多段落罗列的形式):\n";

    // 调用 AI 接口
    const tmp = await getAiSummary(description + documentContent);
    const summaryMarkdown = tmp.data;

    // Markdown 转 HTML + 净化（防止 XSS 攻击）
    const rawHtml = marked.parse(summaryMarkdown);
    summary.value = DOMPurify.sanitize(rawHtml as string);

    // 生成截断后的摘要
    truncatedSummary.value = truncateHtml(summary.value);

    // 确保 DOM 更新后再操作展开状态
    await nextTick();
    showMore.value = false;
  } catch (err: any) {
    error.value = '生成摘要失败: ' + (err.message || '未知错误');
    console.error('生成摘要失败:', err);
  } finally {
    loading.value = false;
  }
};

/**
 * 刷新摘要：调用 generateSummary 重新生成
 * - 防止重复点击（通过 loading 状态控制）
 */
const refreshSummary = async () => {
  if (loading.value) return; 
  await generateSummary();
};

/**
 * 截断 HTML 内容：优先显示标题 + 第一段
 * 1. 创建临时 DOM 解析 HTML
 * 2. 查找第一个标题（h1/h2/h3）或段落（p）
 * 3. 拼接需要显示的内容，并添加省略号提示
 */
const truncateHtml = (html: string): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // 查找第一个标题或段落
  const firstElement = tempDiv.querySelector('h1, h2, h3, p');
  
  if (!firstElement) {
    return html; // 无标题/段落时返回全部内容
  }
  
  const container = document.createElement('div');

  // 标题逻辑：显示标题 + 其后第一个段落
  if (['H1', 'H2', 'H3'].includes(firstElement.tagName)) {
    container.appendChild(firstElement.cloneNode(true));
    
    const firstParagraph = firstElement.nextElementSibling;
    if (firstParagraph && firstParagraph.tagName === 'P') {
      container.appendChild(firstParagraph.cloneNode(true));
    }
  } 
  // 段落逻辑：直接显示第一个段落
  else if (firstElement.tagName === 'P') {
    container.appendChild(firstElement.cloneNode(true));
  }
  
  // 添加省略号提示
  appendEllipsis(container);
  return container.innerHTML;
};

/**
 * 追加省略号提示：引导用户点击展开
 * - 创建带提示文案的 DOM 元素，添加到容器中
 */
const appendEllipsis = (container: HTMLElement) => {
  const ellipsis = document.createElement('p');
  ellipsis.className = 'ellipsis';
  ellipsis.innerHTML = '<i class="el-icon-ellipsis-h"></i> <span>点击"展开"查看更多</span>';
  container.appendChild(ellipsis);
};

/**
 * 复制摘要内容：纯文本复制
 * 1. 创建临时 DOM 提取纯文本
 * 2. 调用剪贴板 API 复制
 * 3. 反馈复制结果（动画 + 状态重置）
 */
const copySummary = async () => {
  if (!summary.value) return;
  
  copySuccess.value = false; 

  const tempElement = document.createElement('div');
  tempElement.innerHTML = summary.value;
  
  try {
    await navigator.clipboard.writeText(tempElement.textContent || '');
    copySuccess.value = true;

    // 3 秒后重置复制状态
    setTimeout(() => {
      copySuccess.value = false;
    }, 3000);

    // 显示复制成功提示（动画消失）
    const toast = document.createElement('div');
    toast.className = 'copy-toast';
    toast.innerHTML = '<i class="el-icon-check"></i> 摘要已复制到剪贴板';
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 2000);
  } catch (err) {
    console.error('复制失败:', err);
  }
};

/**
 * 切换 AI 速览容器的显示/隐藏
 * - 修改 visible 状态，触发过渡动画
 */
const toggleVisibility = () => {
  visible.value = !visible.value;
};

/**
 * 切换摘要内容的展开/收起
 * - 修改 showMore 状态，触发内容高度过渡
 */
const toggleShowMore = () => {
  showMore.value = !showMore.value;
};
</script>

<style lang="scss" scoped>
/* 原样式保持不变，可根据需要补充注释 */
.selected-text-display {
  margin-top: 10px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
  color: #666;
}

.show-dialog-btn {
  margin-top: 10px;
  padding: 8px 16px;
  background-color: #409eff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}
</style>