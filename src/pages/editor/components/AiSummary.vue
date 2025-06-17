<template>
  <div class="ai-overview-container" v-show="visible">
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
</template>

<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import type { Editor } from '@tiptap/vue-3';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { 
  Refresh, Loading, CaretRight, CaretTop,
  DocumentCopy, Check, Close, CircleClose 
} from '@element-plus/icons-vue';
import '@/styles/summary.scss'; // 引入样式文件

// 只接收editor作为参数
const { editor } = defineProps<{
  editor: Editor | null;
}>();

// 配置marked选项
marked.setOptions({
  gfm: true,        // 支持GitHub风格的Markdown
  breaks: true,     // 支持换行符
});

// 组件状态
const visible = ref(true);
const showMore = ref(false);
const loading = ref(false);
const error = ref('');
const summary = ref(''); // 完整摘要
const truncatedSummary = ref(''); // 截断后的摘要
const copySuccess = ref(false); // 复制成功状态

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
    
    // 调用后端API生成摘要 (模拟API调用)
    const summaryMarkdown = await generateAISummary(documentContent);
    // const summaryMarkdown = documentContent;
    
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

// 模拟后端API调用
const generateAISummary = (content: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // 模拟从HTML内容生成Markdown摘要
      resolve(`这些是前端开发的基础语言：

---

- **UI 库**  
  - Ant Design（React）  
  - Element Plus（Vue）  
  - Bootstrap（基于原生 CSS 和 JavaScript 的 UI 框架）

---
### 3. **状态管理**

### 4. **构建工具**
为了优化和打包前端代码，通常需要使用构建工具：
- **模块打包器**  
  - Webpack：最常用的模块打包工具。
  - Vite：新一代快速开发工具，适合现代 JavaScript 项目。
- **任务运行器**  
  - Grunt
- **代码检查工具**  

### 5. **版本控制系统**
用于协作开发和代码管理：
---
### 6. **前端路由**
单页应用（SPA）需要前端路由来管理页面跳转：
- React Router（React 生态）

---

### 7. **HTTP 请求与 API 调用**
前端需要与后端进行数据交互：
- Axios：一个基于 Promise 的 HTTP 客户端。
- Fetch API：现代浏览器内置的 API。
- Less

---
### 9. **测试工具**
确保代码质量和稳定性：
- Cypress：端到端测试工具。

### 10. **性能优化工具**
- Webpack Bundle Analyzer：分析打包文件大小。
  - Flutter Web（虽然不是传统前端技术，但支持 Web 开发）
- **桌面应用开发**  
  - Electron（结合 Node.js 和 Chromium）
---
### 12. **其他相关技术**
- **TypeScript**：JavaScript 的超集，提供静态类型检查。
- **GraphQL**：替代 REST 的查询语言。
前端技术栈是一个不断发展的领域，开发者需要根据项目需求和技术趋势选择合适的工具和技术。对于初学者来说，可以从 HTML、CSS 和 JavaScript 入手，逐步学习框架、构建工具和其他高级技术。`);
    }, 800);
  });
};

</script>

<style lang="scss" scoped></style>