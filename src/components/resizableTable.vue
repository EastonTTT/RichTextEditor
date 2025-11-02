<template>
  <div class="table">
<<<<<<< HEAD
    <div class="table-header">
      <div v-for="(col, index) in columns" :key="col.key" class="table-cell header-cell" :style="{ width: col.width + 'px'}">
        <div>{{ col.title }}</div>
        <!-- 宽度调整拖拽 -->
        <div class="resizer" v-if="index !== columns.length - 1" @mousedown="startResizing($event, index)"></div>
=======
    <div class="table-header" @mouseenter="showResizer" @mouseleave="hideResizer">
      <div v-for="(col, index) in columns" :key="col.key" class="table-cell header-cell"
        :style="{ width: col.width + 'px' }">
        <div class="resizer" v-if="index !== 0 && true" @mousedown="startResizing($event, index)"></div>
        <div>{{ col.title }}</div>
        <!-- 宽度调整拖拽 -->
>>>>>>> 270065f866d7a687ae93403ab51c8227addde799
      </div>
    </div>
    <div class="table-body">
      <div v-for="(item, index) in data" :key="index" class="row">
<<<<<<< HEAD
        <div v-for="col in columns" :key="col.key" class="cont-cell" :style="{ width: col.width + 'px'}">
=======
        <div v-for="col in columns" :key="col.key" class="body-cell" :style="{ width: col.width + 'px' }">
>>>>>>> 270065f866d7a687ae93403ab51c8227addde799
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
<<<<<<< HEAD
=======
import { ref } from 'vue';
>>>>>>> 270065f866d7a687ae93403ab51c8227addde799
const props = defineProps<{
  columns: tableColumns[],
  data
}>()

const emit = defineEmits(['updateColumn'])

<<<<<<< HEAD
=======
//表格拖拽动态显示
const isShowResizer = ref(false)
function showResizer() {
  isShowResizer.value = true;
}
function hideResizer() {
  isShowResizer.value = false;
}

>>>>>>> 270065f866d7a687ae93403ab51c8227addde799
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
<<<<<<< HEAD
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
=======
  padding: 10px;

  .table-header {
    display: flex;

    .header-cell {
      position: relative;
      padding: 5px;
      display: flex;
    }

    .resizer {
      position: absolute;
      top: 50%;
      left: 0;
      transform: translateY(-50%);
      width: 5px;
      border: 0 1px 0 1px solid black;
    }
  }

  .table-body {
    .row {
      padding: 5px;
      display: flex;
      align-items: center;
      height: 45px;
      border-bottom: 1px solid #dededf;
      border-top: 1px solid #dededf;

      &:hover {
        background-color: #edeeee;
        border-radius: 10px;
      }
    }

>>>>>>> 270065f866d7a687ae93403ab51c8227addde799
  }


}
</style>
