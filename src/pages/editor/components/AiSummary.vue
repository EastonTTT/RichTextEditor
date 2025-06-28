<template>
  <!-- 按钮过渡组 -->
  <transition-group name="btn-fade" tag="div" class="toggle-btn-container">
    <button 
      v-if="!visible&&mode=='read'" 
      @click="showComponent" 
      class="ai-toggle-btn"
      key="btn"
    >
      <el-icon class="toggle-icon"><Lightning /></el-icon>
      <span>AI速览</span>
    </button>
  </transition-group>
   <transition name="component-fade" mode="out-in">
    <div class="ai-overview-container" v-show="visible&&mode=='read'">
      <div class="ai-overview-header">
        <h3 class="ai-title">AI速览</h3>
        <div class="ai-actions">
          <button @click="refreshSummary" class="action-btn" :class="{ 'loading-btn': loading }">
            <el-icon v-if="!loading" class="action-icon"><Refresh /></el-icon>
            <el-icon v-else class="action-icon spin-icon"><Loading /></el-icon>
            <span>{{ loading ? '生成中...' : '总结' }}</span>
          </button>
          <button @click="toggleShowMore" class="action-btn">
            <el-icon class="action-icon" :class="{ 'rotate-icon': showMore }">
              <!-- 根据状态显示不同图标 -->
              <template v-if="showMore">
                <CaretTop />
              </template>
              <template v-else>
                <CaretRight />
              </template>
            </el-icon>
            <span>{{ showMore ? '收起' : '展开' }}</span>
          </button>
          <button @click="copySummary" class="action-btn" :class="{ 'copied': copySuccess }">
            <el-icon v-if="!copySuccess" class="action-icon"><DocumentCopy /></el-icon>
            <el-icon v-else class="action-icon copied-icon"><Check /></el-icon>
            <span>{{ copySuccess ? '已复制' : '复制' }}</span>
          </button>
          <button @click="toggleVisibility" class="action-btn">
            <el-icon class="action-icon"><Close /></el-icon>
            <span>关闭</span>
          </button>
        </div>
      </div>
      
      <div v-if="loading" class="ai-overview-loading">
        <div class="spinner"></div>
        <p class="loading-text">正在生成摘要...</p>
      </div>
      
      <div v-else-if="error" class="ai-overview-error">
        <el-icon class="error-icon"><CircleClose /></el-icon>
        <p class="error-text">{{ error }}</p>
      </div>
      
      <div v-else class="ai-overview-content">
        <div 
          class="summary-content"
          :class="{ 'expanded': showMore ,'collapsed-text': !showMore }"
        >
          <!-- 增加内容为空时的默认提示 -->
          <div v-if="!summary && !truncatedSummary" class="default-tip">
            <p>暂无摘要内容，点击"总结"按钮生成摘要</p>
          </div>
          
          <div v-else v-html="showMore ? summary : truncatedSummary"></div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import type { Editor } from '@tiptap/vue-3';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { 
  Refresh, Loading, CaretRight, CaretTop,
  DocumentCopy, Check, Close, CircleClose ,Lightning 
} from '@element-plus/icons-vue';
import '@/styles/summary.scss'; // 引入样式文件
import { getAiSummary } from '@/api/editor';

// 只接收editor作为参数
const { editor, mode } = defineProps<{
  editor: Editor | null;
  mode: String;
}>();

// 配置marked选项
marked.setOptions({
  gfm: true,        // 支持GitHub风格的Markdown
  breaks: true,     // 支持换行符
});

// 组件状态
const visible = ref(false);
const showMore = ref(false);
const loading = ref(false);
const error = ref('');
const summary = ref(''); // 完整摘要
const truncatedSummary = ref(''); // 截断后的摘要
const copySuccess = ref(false); // 复制成功状态

// 显示组件的方法
const showComponent = () => {
  visible.value = true;
};

// 生成摘要
const generateSummary = async () => {
  if (!editor) {
    error.value = '编辑器实例不存在';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
     // 使用 getHTML() 方法获取带格式的内容
    const documentContent = editor.getHTML();
    
    const description = "请简要为下面这篇文档内容做个总结,总结可以掺杂一些emoji(控制在300字左右):\n"

    const tmp = await getAiSummary(description+documentContent);
    const summaryMarkdown = tmp.data;

    // 使用marked将Markdown转换为HTML
    const rawHtml = marked.parse(summaryMarkdown);
    
    // 使用DOMPurify净化HTML，防止XSS攻击
    summary.value = DOMPurify.sanitize(rawHtml as string);
    
    // 生成截断的摘要
    truncatedSummary.value = truncateHtml(summary.value);

    // 添加展开/收起动画
    await nextTick();
    showMore.value = false;
  } catch (err: any) {
    error.value = '生成摘要失败: ' + (err.message || '未知错误');
    console.error('生成摘要失败:', err);
  } finally {
    loading.value = false;
  }
};

// 刷新摘要
const refreshSummary = async () => {
  if (loading.value) return; // 防止重复点击
  await generateSummary();
};

// 截断HTML内容（优先显示第一个标题或第一个<p>标签内容）
const truncateHtml = (html: string): string => {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  
  // 查找第一个标题元素或第一个<p>标签
  const firstElement = tempDiv.querySelector('h1, h2, h3, p');
  
  if (!firstElement) {
    return html; // 没有标题和<p>标签，返回全部内容
  }
  
  const container = document.createElement('div');
  
  // 如果是标题，显示标题及其后的第一个<p>标签
  if (['H1', 'H2', 'H3'].includes(firstElement.tagName)) {
    container.appendChild(firstElement.cloneNode(true));
    
    // 查找标题后的第一个<p>标签
    const firstParagraph = firstElement.nextElementSibling;
    if (firstParagraph && firstParagraph.tagName === 'P') {
      container.appendChild(firstParagraph.cloneNode(true));
    }
  } 
  // 如果是<p>标签，直接显示
  else if (firstElement.tagName === 'P') {
    container.appendChild(firstElement.cloneNode(true));
  }
  
  appendEllipsis(container);
  return container.innerHTML;
};

// 添加省略号提示
const appendEllipsis = (container: HTMLElement) => {
  const ellipsis = document.createElement('p');
  ellipsis.className = 'ellipsis';
  ellipsis.innerHTML = '<i class="el-icon-ellipsis-h"></i> <span>点击"展开"查看更多</span>';
  container.appendChild(ellipsis);
};

// 复制摘要内容
const copySummary = async () => {
  if (!summary.value) return;
  
  copySuccess.value = false; // 重置状态

  // 创建临时元素用于复制纯文本内容
  const tempElement = document.createElement('div');
  tempElement.innerHTML = summary.value;
  
   try {
    await navigator.clipboard.writeText(tempElement.textContent || '');
    
    // 显示复制成功状态
    copySuccess.value = true;
    
    // 3秒后恢复默认状态
    setTimeout(() => {
      copySuccess.value = false;
    }, 3000);
    
    // 显示复制成功提示
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

// 切换可见性
const toggleVisibility = () => {
  visible.value = !visible.value;
};

// 切换显示更多/更少
const toggleShowMore = () => {
  showMore.value = !showMore.value;
};

</script>

<style lang="scss" scoped></style>