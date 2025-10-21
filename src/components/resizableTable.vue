<template>
  <div class="table">
    <div class="table-header">
      <div v-for="(col, index) in columns" :key="col.key" class="table-cell header-cell">
        <div>{{ col.title }}</div>
        <!-- 宽度调整拖拽 -->
        <div class="resizer" v-if="index !== columns.length - 1" @mousedown="startResizing($event, index)"></div>
      </div>
    </div>
    <div class="table-body">
      <div v-for="(item, index) in data" :key="index">
        <div v-for="col in columns" :key="col.key">
          <slot :name="col.key" :row="item">
            <div>{{ item[col.key] }}</div>
          </slot>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang='ts'>
import type { tableColumns } from '@/types/resizableTable';
const props = defineProps<{
  columns: tableColumns[],
  data
}>()

const emit = defineEmits(['updateColumn'])

//处理表格拖拽逻辑
let startX = 0;
let startWidth = 0;
let resizingIndex = 0;
function startResizing(event: MouseEvent, index: number) {
  startX = event.clientX
  startWidth = props.columns[index].width
  resizingIndex = index

  document.addEventListener('mousemove', onResizing)
  document.addEventListener('mouseup', stopResizing)
}

function onResizing(event: MouseEvent) {
  const delta = event.clientX - startX
  emit('updateColumn', resizingIndex, Math.max(props.columns[resizingIndex].minwidth, startWidth + delta))
}

function stopResizing() {
  document.removeEventListener('mousemove', onResizing)
  document.removeEventListener('mouseup', stopResizing)
}
</script>

<style lang="scss" scoped>
.table {
  .table-header {
    display: flex;
    border-bottom: 1px solid gray;
  }


}
</style>
