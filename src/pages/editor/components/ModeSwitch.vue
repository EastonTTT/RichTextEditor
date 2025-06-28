<template>
  <!-- 模式切换组件容器，根据当前模式添加对应的CSS类 -->
  <div
    class="custom-mode-switch"
    :class="`mode-${currentMode}`"
    :style="{ top: `${position.y}px`, left: `${position.x}px` }"
    @mousedown="startDrag"
  >
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
    const position = ref({ x: 20, y: 700 }); // 初始位置
    const isDragging = ref(false);
    
    // 模式选项配置数组 - 仅保留编辑和阅读模式
    const modeOptions = [
      { value: 'edit', label: '编辑', iconUnicode: '✏️' },
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
    
    const startDrag = (e) => {
      isDragging.value = true;
      
      // 记录初始鼠标位置和组件位置
      const startX = e.clientX;
      const startY = e.clientY;
      const startComponentX = position.value.x;
      const startComponentY = position.value.y;
      
      // 监听全局鼠标移动事件
      const onMouseMove = (moveEvent) => {
        if (!isDragging.value) return;
        
        // 计算新的位置
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        
        position.value.x = startComponentX + deltaX;
        position.value.y = startComponentY + deltaY;
      };

      // 监听全局鼠标释放事件
      const onMouseUp = () => {
        isDragging.value = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    // 监听外部传入的模式变化（用于处理父组件主动修改模式的情况）
    watch(() => props.modelValue, (newVal) => {
      if (newVal !== currentMode.value) {
        currentMode.value = newVal;
      }
    });

    return {
      currentMode,
      modeOptions,
      position,
      switchMode,
      startDrag
    };
  }
}
</script>

<style scoped>
/* 整体容器样式 */
.custom-mode-switch {
  display: flex;
  position: fixed;
  z-index: 1000;
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  cursor: move; /* 添加可拖动指示器 */
  user-select: none; /* 防止拖动时选中文本 */
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

/* 阅读模式激活状态的特殊样式 */
.mode-read .mode-option.active {
  color: #67c23a;
  background-color: rgba(103, 194, 58, 0.08);
}

/* Unicode图标样式 */
.icon-unicode {
  margin-right: 8px;
  font-size: 16px;
}
</style>