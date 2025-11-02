<template>
  <div class="table">
    <div class="table-header">
      <div v-for="(col, index) in columns" :key="col.key" class="table-cell header-cell" :style="{ width: col.width + 'px'}">
        <div>{{ col.title }}</div>
        <!-- 宽度调整拖拽 -->
        <div class="resizer" v-if="index !== columns.length - 1" @mousedown="startResizing($event, index)"></div>
      </div>
    </div>
    <div class="table-body">
      <div v-for="(item, index) in data" :key="index" class="row">
        <div v-for="col in columns" :key="col.key" class="cont-cell" :style="{ width: col.width + 'px'}">
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
  font-size: 18px;
  .table-header {
    display: flex;
    margin-bottom: 5px;
  }

  .resizer{

  }

  .table-body{
    .row{
      display: flex;
      align-items: center;
      height: 50px;
      border-bottom: 2px solid #dededf;
      border-top: 2px solid #dededf;

      &:hover{
        background-color:#edeeee;
        border-radius: 5px;
        border: none;
        cursor: pointer;

      }

      .cont-cell{
        display: flex;
      }
    }
  }


}
</style>
