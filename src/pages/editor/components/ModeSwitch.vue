<template>
  <!-- 模式切换组件容器，根据当前模式添加对应的CSS类 -->
  <div class="custom-mode-switch" :class="`mode-${currentMode}`">
    <!-- 循环渲染模式选项 -->
    <div
      v-for="option in modeOptions"
      :key="option.value"
      :class="['mode-option', { active: currentMode === option.value }]"
      @click="switchMode(option.value)"
    >
      <!-- 使用Unicode字符作为图标 -->
      <span class="icon-unicode">{{ option.iconUnicode }}</span>
      <!-- 显示模式名称 -->
      <span>{{ option.label }}</span>
    </div>
  </div>
</template>

<script>
import { ref, defineEmits, watch } from 'vue';

export default {
  name: 'ModeSwitch',
  
  // 接收外部传入的当前模式
  props: {
    modelValue: {
      type: String,
      default: 'edit' // 默认模式为"编辑"
    }
  },
  
  // 定义触发的事件
  emits: ['update:modelValue'],
  
  setup(props, { emit }) {
    // 使用ref创建响应式数据，存储当前模式
    const currentMode = ref(props.modelValue);
    
    // 模式选项配置数组
    const modeOptions = [
      { value: 'edit', label: '编辑', iconUnicode: '✏️' },
      { value: 'review', label: '修订', iconUnicode: '✅' },
      { value: 'read', label: '阅读', iconUnicode: '📖' },
    ];
    
    // 切换模式的方法
    const switchMode = (mode) => {
      // 仅在模式变化时执行更新
      if (mode !== currentMode.value) {
        // 更新本地状态
        currentMode.value = mode;
        // 触发v-model更新事件
        emit('update:modelValue', mode);
      }
    };
    
    // 监听外部传入的模式变化（用于处理父组件主动修改模式的情况）
    watch(() => props.modelValue, (newVal) => {
      if (newVal !== currentMode.value) {
        currentMode.value = newVal;
      }
    });

    return {
      currentMode,
      modeOptions,
      switchMode
    };
  }
}
</script>

<style scoped>
/* 整体容器样式 */
.custom-mode-switch {
  display: flex;
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: all 0.3s ease;
}

/* 悬停效果：提升阴影深度并轻微上浮 */
.custom-mode-switch:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

/* 单个模式选项样式 */
.mode-option {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

/* 选项分隔线 */
.mode-option:not(:last-child) {
  border-right: 1px solid rgba(220, 223, 230, 0.5);
}

/* 悬停状态样式 */
.mode-option:hover {
  background-color: rgba(245, 247, 250, 0.8);
}

/* 激活状态样式 */
.mode-option.active {
  font-weight: 500;
}

/* 编辑模式激活状态的特殊样式 */
.mode-edit .mode-option.active {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.08);
}

/* 修订模式激活状态的特殊样式 */
.mode-review .mode-option.active {
  color: #e6a23c;
  background-color: rgba(230, 162, 60, 0.08);
}

/* 阅读模式激活状态的特殊样式 */
.mode-read .mode-option.active {
  color: #67c23a;
  background-color: rgba(103, 194, 58, 0.08);
}

/* 图标样式（保留原样式定义，尽管实际使用的是span.icon-unicode） */
.mode-option i {
  margin-right: 8px;
  font-size: 16px;
}

/* Unicode图标样式 */
.icon-unicode {
  margin-right: 8px;
  font-size: 16px;
}
</style>