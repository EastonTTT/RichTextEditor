<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app">
    <RouterView></RouterView>
  </div>
</template>

<style scoped>
.app {
    min-width: 1500px;
    background-color: #f5f5f5;
    /* display: flex;
    flex-direction: column;
     justify-content: center; 
    align-items: center; */
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }
</style>
