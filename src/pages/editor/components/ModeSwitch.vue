<template>
  <!-- 自定义模式切换器：支持拖拽定位，显示当前编辑/阅读模式 -->
  <div
    class="custom-mode-switch"
    :class="`mode-${currentMode}`"
    :style="{ top: `${position.y}px`, left: `${position.x}px` }"
    @mousedown="startDrag"
  >
    <!-- 模式选项列表 -->
    <div
      v-for="option in modeOptions"
      :key="option.value"
      :class="['mode-option', { active: currentMode === option.value }]"
      @click="switchMode(option.value)"
    >
      <span class="icon-unicode">{{ option.iconUnicode }}</span>
      <span>{{ option.label }}</span>
    </div>
  </div>
</template>

<script>
import { ref, defineEmits, watch } from 'vue';

export default {
  name: 'ModeSwitch',
  
  // 组件属性
  props: {
    modelValue: {
      type: String,
      default: 'edit' // 默认编辑模式
    }
  },
  
  // 向外触发的事件
  emits: ['update:modelValue'],
  
  setup(props, { emit }) {
    // 组件状态
    const currentMode = ref(props.modelValue);      // 当前选中模式
    const position = ref({ x: 20, y: 700 });        // 组件位置（支持拖拽）
    const isDragging = ref(false);                  // 是否正在拖拽
    
    // 模式选项配置
    const modeOptions = [
      { value: 'edit', label: '编辑', iconUnicode: '✏️' },
      { value: 'read', label: '阅读', iconUnicode: '📖' },
    ];
    
    /**
     * 切换编辑/阅读模式
     * @param {string} mode - 目标模式值
     */
    const switchMode = (mode) => {
      if (mode !== currentMode.value) {
        currentMode.value = mode;                  // 更新本地状态
        emit('update:modelValue', mode);           // 通知父组件更新v-model
      }
    };
    
    /**
     * 开始拖拽组件
     * @param {MouseEvent} e - 鼠标按下事件
     */
    const startDrag = (e) => {
      isDragging.value = true;
      
      // 记录初始位置
      const startX = e.clientX;
      const startY = e.clientY;
      const startComponentX = position.value.x;
      const startComponentY = position.value.y;
      
      // 鼠标移动事件处理（全局监听）
      const onMouseMove = (moveEvent) => {
        if (!isDragging.value) return;
        
        // 计算并更新组件位置
        const deltaX = moveEvent.clientX - startX;
        const deltaY = moveEvent.clientY - startY;
        position.value.x = startComponentX + deltaX;
        position.value.y = startComponentY + deltaY;
      };

      // 鼠标释放事件处理（全局监听）
      const onMouseUp = () => {
        isDragging.value = false;
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      };
    
      // 注册全局事件监听
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    };

    // 监听外部模式变更（父组件主动修改v-model时）
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
  cursor: move;             /* 鼠标样式：显示可拖动状态 */
  user-select: none;        /* 防止拖拽时选中文本 */
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
  min-width: 80px;          /* 确保选项宽度一致 */
}

/* 选项分隔线 */
.mode-option:not(:last-child) {
  border-right: 1px solid rgba(220, 223, 230, 0.5);
}

/* 选项悬停效果 */
.mode-option:hover {
  background-color: rgba(245, 247, 250, 0.8);
}

/* 激活状态样式 */
.mode-option.active {
  font-weight: 500;         /* 激活状态字体加粗 */
}

/* 编辑模式激活状态的特殊样式 */
.mode-edit .mode-option.active {
  color: #409eff;           /* 编辑模式主色调：蓝色 */
  background-color: rgba(64, 158, 255, 0.08);
}

/* 阅读模式激活状态的特殊样式 */
.mode-read .mode-option.active {
  color: #67c23a;           /* 阅读模式主色调：绿色 */
  background-color: rgba(103, 194, 58, 0.08);
}

/* Unicode图标样式 */
.icon-unicode {
  margin-right: 8px;
  font-size: 16px;
}
</style>