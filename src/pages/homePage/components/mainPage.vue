<template>
  <div class="container">
    <div class="title">主页</div>
    <buttonsPanel />
    <tabBar />
    <resizableTable :columns="columns" :data="tableData" >
      <template #action="{row}">
        <actionMenu :row="row"/>
      </template>
    </resizableTable>
  </div>
</template>

<script setup lang='ts'>
import buttonsPanel from './buttonsPanel.vue';
import tabBar from './tabBar.vue';
import resizableTable from '@/components/resizableTable.vue';
import actionMenu from './actionMenu.vue';
import type { tableColumns } from '@/types/resizableTable';
const columns: tableColumns[] = [
  {
    title: '文档名称',
    key: 'docName',
    minwidth: 30,
    width: 600,
  },
  {
    title: '所有者',
    key: 'author',
    minwidth: 30,
    width: 300,
  },
  {
    title: '上次修改时间',
    key: 'lastModify',
    minwidth: 30,
    width: 400,
  },
  {
    title: '操作',
    key: 'action',
    minwidth: 30,
    width: 200,
  },
]

const tableData = [
  {
    docName: '未命名文档',
    author: 'EastonTT',
    lastModify: 'today',
  }

]
</script>

<style lang="scss" scoped>
.container{
  padding: 10px;
  .title{
    font-weight: 600;
    margin-bottom: 20px;
  }
}
</style>
