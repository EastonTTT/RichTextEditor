<template>
  <div class="wrapper">
    <div class="side-bar">
      <sideBar />
    </div>
    <div class="main-page">
      <mainPage />
    </div>
  </div>
</template>
<script setup lang="ts">
defineOptions({
  name: 'homePage'
})

import sideBar from './components/sideBar.vue';
import mainPage from './components/mainPage.vue';
</script>
<style lang="scss" scoped>
.wrapper {
  display: flex;

  .main-page {
    padding: 10px;
    flex: 1;
  }
}
</style>
