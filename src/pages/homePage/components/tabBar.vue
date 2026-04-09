<template>
  <div class="wrapper">
    <button
      v-for="tab in filters"
      :key="tab.value"
      class="tab"
      :class="{ active: tab.value === modelValue }"
      @click="emit('update:modelValue', tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>

<script setup lang="ts">
// 展示文档列表与知识库列表共用的筛选标签页。
import { homeFilters } from '@/constants/homePage'

// tabBar 是一个纯展示组件，选项来源完全由常量驱动。
defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const filters = homeFilters
</script>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  margin: 16px 0;
  gap: 12px;
}

.tab {
  appearance: none;
  border: none;
  background: transparent;
  color: #575a5f;
  font-size: 16px;
  padding: 8px 12px;
  border-radius: 999px;
}

.tab:hover {
  cursor: pointer;
  background-color: #edeeee;
}

.tab.active {
  background: #111827;
  color: #fff;
}
</style>
