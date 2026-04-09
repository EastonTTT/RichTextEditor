<script setup lang="ts">
// 承载路由切换后的应用页面视图。
import { RouterView } from 'vue-router'

// App 作为最外层壳子，只承载当前路由页面。
</script>

<template>
  <div class="app">
    <RouterView></RouterView>
  </div>
</template>

<style scoped></style>
