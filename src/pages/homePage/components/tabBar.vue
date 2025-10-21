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

  .tab {
    color: #646a73;
    font-size: 20px;
    padding: 5px;
    margin: 5px;
    border-radius: 10px;

    &:hover {
      background-color: #edeeee;
    }
  }
}
</style>
