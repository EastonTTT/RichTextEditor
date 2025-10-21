<template>
  <div class="wrapper">
    <div class="user-info"> Hi~ EastonTT</div>
    <div class="search">click to search</div>
    <div v-for="tab in menuTabs" :key="tab.val" class="tab">
      <component :is="tab.icon" class="icon"></component>
      <p class="name">{{ tab.name }}</p>
    </div>
    <div v-for="topCont in topConts" :key="topCont.val" class="collapse">
      <div class="header" @click="setExpandByName(topCont.name)">
        <div>{{ topCont.name }}</div>
        <el-icon v-if="!topCont.expand" class="icon">
          <ArrowRight />
        </el-icon>
        <el-icon v-if="topCont.expand" class="icon">
          <ArrowDown />
        </el-icon>
      </div>
      <div v-if="topCont.expand" class="list">
        <component :is="topCont.icon" class="icon"></component>
        <div>111</div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { menuTabs, } from '@/constants/homePage';
import { } from '@/constants/homePage';
import { reactive } from 'vue';

const topConts = reactive([
  {
    name: '置顶文档',
    val: 'topDoc',
    icon: 'Document',
    expand: false,
  },
  {
    name: '置顶知识库',
    val: 'topKnowledgeBase',
    icon: 'Collection',
    expand: false,
  }
])
// const resizable = {
//   minWidth: 200,
//   maxWidth: 600,
//   initialWidth: 250,
//   unit: 'px',
// }

function setExpandByName(tabName: string) {
  const target = topConts.find(item => item.name === tabName)
  if (target) {
    target.expand = !target.expand
  } else {
    console.log('未找到符合条件的tab')
  }
}


</script>
<style lang="scss" scoped>
.wrapper {
  background-color: #F5F6F7;
  min-width: 250px;
  max-width: 300px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 10px;

  .user-info {
    text-align: center;
    height: 40px;
  }

  .search {
    padding: 10px;
    background-color: #fff;
    font-size: 15px;
    color: gray;
    border-radius: 10px;
  }

  .icon {
    width: 20px;
    height: 20px;
    margin-right: 5px;
  }

  .tab {
    height: 30px;
    padding: 5px;
    margin: 5px;
    display: flex;
    align-items: center;
    font-size: 20px;
  }

  .collapse {
    padding: 5px;
    margin: 5px;
    font-size: 15px;
    color: #a1a1a1;

    .header {
      display: flex;
      align-items: center;

      .icon {
        margin-left: 5px;
      }
    }

    .list {
      padding: 5px 5px;
      display: flex;
      align-items: center;
      color: #000;
    }
  }
}
</style>
