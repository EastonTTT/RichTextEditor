<template>
  <div class="table">
    <div class="table-header">
      <div
        v-for="(col, index) in normalizedColumns"
        :key="col.key"
        class="table-cell header-cell"
        :style="{ width: col.width ? `${col.width}px` : 'auto' }"
      >
        <div>{{ col.title }}</div>
        <div class="resizer" v-if="index !== normalizedColumns.length - 1" @mousedown="startResizing($event, index)"></div>
      </div>
    </div>
    <div class="table-body">
      <div v-for="(item, index) in data" :key="index" class="row">
        <div
          v-for="col in normalizedColumns"
          :key="col.key"
          class="cont-cell"
          :style="{ width: col.width ? `${col.width}px` : 'auto' }"
        >
          <slot :name="col.key" :row="item">
            <div>{{ item[col.key] }}</div>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 为列表页面渲染支持用户拖拽调节列宽的表格。
import type { tableColumns } from '@/types/resizableTable'
import { computed } from 'vue'

const props = defineProps<{
  columns: tableColumns[]
  data: Record<string, unknown>[]
}>()

const emit = defineEmits<{
  updateColumn: [index: number, width: number]
}>()

// 为每列补默认宽度，避免调用方必须给全量尺寸配置。
const normalizedColumns = computed(() =>
  props.columns.map((column) => ({
    ...column,
    minwidth: column.minwidth ?? 120,
    width: column.width ?? 200,
  })),
)

let startX = 0
let startWidth = 0
let resizingIndex = 0

function startResizing(event: MouseEvent, index: number) {
  // 拖拽时把初始鼠标位置和列宽记下来，后续移动只计算增量。
  event.preventDefault()
  startX = event.clientX
  startWidth = normalizedColumns.value[index].width
  resizingIndex = index

  document.addEventListener('mousemove', onResizing)
  document.addEventListener('mouseup', stopResizing)
}

function onResizing(event: MouseEvent) {
  // 列宽不能小于最小宽度，避免内容完全被压缩不可读。
  const delta = event.clientX - startX
  emit('updateColumn', resizingIndex, Math.max(normalizedColumns.value[resizingIndex].minwidth, startWidth + delta))
}

function stopResizing() {
  // 鼠标抬起后解除全局监听，防止后续移动继续触发拖拽。
  document.removeEventListener('mousemove', onResizing)
  document.removeEventListener('mouseup', stopResizing)
}
</script>

<style lang="scss" scoped>
.table {
  width: 100%;
  font-size: 14px;
}

.table-header {
  display: flex;
  margin-bottom: 8px;
  border-bottom: 1px solid #e5e7eb;
}

.table-cell,
.cont-cell {
  box-sizing: border-box;
  padding: 12px 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.header-cell {
  position: relative;
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #475569;
}

.resizer {
  position: absolute;
  top: 8px;
  right: 0;
  width: 6px;
  height: calc(100% - 16px);
  cursor: col-resize;
}

.row {
  display: flex;
  align-items: stretch;
  border-bottom: 1px solid #edf2f7;
}

.row:hover {
  background-color: #f8fafc;
  border-radius: 8px;
  cursor: pointer;
}

.cont-cell {
  display: flex;
  align-items: center;
}
</style>
