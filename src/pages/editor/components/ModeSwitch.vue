<template>
  <div class="custom-mode-switch" :class="`mode-${currentMode}`">
    <div
      v-for="option in modeOptions"
      :key="option.value"
      :class="['mode-option', { active: currentMode === option.value }]"
      @click="switchMode(option.value)"
    >
      <i :class="option.iconClass"></i>
      <span>{{ option.label }}</span>
    </div>
  </div>
</template>

<script>
import { ref, defineEmits, watch } from 'vue';

export default {
  name: 'ModeSwitch',
  props: {
    modelValue: {
      type: String,
      default: 'edit'
    }
  },
  emits: ['update:modelValue', 'mode-change'],
  setup(props, { emit }) {
    const currentMode = ref(props.modelValue);
    
    const modeOptions = [
      { value: 'edit', label: '编辑', iconClass: 'fa fa-pencil' },
      { value: 'review', label: '修订', iconClass: 'fa fa-check-square-o' },
      { value: 'read', label: '阅读', iconClass: 'fa fa-book' }
    ];
    
    const switchMode = (mode) => {
      if (mode !== currentMode.value) {
        currentMode.value = mode;
        emit('update:modelValue', mode);
        emit('mode-change', mode);
      }
    };
    
    // 监听外部传入值的变化
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

.custom-mode-switch:hover {
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

/* 模式选项样式 */
.mode-option {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 80px;
}

.mode-option:not(:last-child) {
  border-right: 1px solid rgba(220, 223, 230, 0.5);
}

.mode-option:hover {
  background-color: rgba(245, 247, 250, 0.8);
}

.mode-option.active {
  font-weight: 500;
}

/* 不同模式下的活动状态样式 */
.mode-edit .mode-option.active {
  color: #409eff;
  background-color: rgba(64, 158, 255, 0.08);
}

.mode-review .mode-option.active {
  color: #e6a23c;
  background-color: rgba(230, 162, 60, 0.08);
}

.mode-read .mode-option.active {
  color: #67c23a;
  background-color: rgba(103, 194, 58, 0.08);
}

/* 图标样式 */
.mode-option i {
  margin-right: 8px;
  font-size: 16px;
}
</style>
    