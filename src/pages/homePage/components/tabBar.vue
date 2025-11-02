<template>
  <div class="wrapper">
    <div v-for="(tab, index) in tabs" :key="index" class="tab">
      <div class="text">{{ tab.val }}</div>
    </div>
  </div>
</template>
<script setup lang="ts">
const tabs = [
  {
    val: '最近访问',
    routeName: 'recent',
  },
  {
    val: '与我共享',
    routeName: 'shared',
  },
  {
    val: '我的收藏',
    routeName: 'favorites',
  }
]
</script>
<style lang="scss" scoped>
.wrapper {
  display: flex;
  margin: 10px 0;

  .tab {
    color: #575a5f;
    font-size: 20px;
    margin-right: 30px;
    padding: 5px;
     &:hover{
      cursor: pointer;
      background-color: #edeeee;
      border-radius: 5px;
     }
  }
}
</style>
