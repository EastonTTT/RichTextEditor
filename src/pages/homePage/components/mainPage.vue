<template>
<<<<<<< HEAD
  <div class="container">
    <div class="title">主页</div>
    <buttonsPanel />
    <tabBar />
    <resizableTable :columns="columns" :data="tableData" >
      <template #action="{row}">
        <actionMenu :row="row"/>
      </template>
    </resizableTable>
=======
  <div>
    <div>主页</div>
    <buttonsPanel />
    <tabBar />
    <resizableTable :columns="columns" :data="tableData" />

>>>>>>> 270065f866d7a687ae93403ab51c8227addde799
  </div>
</template>

<script setup lang='ts'>
import buttonsPanel from './buttonsPanel.vue';
import tabBar from './tabBar.vue';
import resizableTable from '@/components/resizableTable.vue';
<<<<<<< HEAD
import actionMenu from './actionMenu.vue';
=======
>>>>>>> 270065f866d7a687ae93403ab51c8227addde799
import type { tableColumns } from '@/types/resizableTable';
const columns: tableColumns[] = [
  {
    title: '文档名称',
    key: 'docName',
    minwidth: 30,
<<<<<<< HEAD
    width: 600,
=======
    width: 200,
>>>>>>> 270065f866d7a687ae93403ab51c8227addde799
  },
  {
    title: '所有者',
    key: 'author',
    minwidth: 30,
<<<<<<< HEAD
    width: 300,
=======
    width: 200,
>>>>>>> 270065f866d7a687ae93403ab51c8227addde799
  },
  {
    title: '上次修改时间',
    key: 'lastModify',
    minwidth: 30,
<<<<<<< HEAD
    width: 400,
  },
  {
    title: '操作',
    key: 'action',
    minwidth: 30,
=======
>>>>>>> 270065f866d7a687ae93403ab51c8227addde799
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

<<<<<<< HEAD
<style lang="scss" scoped>
.container{
  padding: 10px;
  .title{
    font-weight: 600;
    margin-bottom: 20px;
  }
}
</style>
=======
<style></style>
>>>>>>> 270065f866d7a687ae93403ab51c8227addde799
