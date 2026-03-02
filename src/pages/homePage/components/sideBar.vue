<template>
  <div class="wrapper">
    <div class="user-card">
      <div class="user-title">Workspace</div>
      <div class="user-name">{{ userName }}</div>
    </div>
    <div class="search-card">
      <div class="search-title">Overview</div>
      <div class="search-desc">{{ documentCount }} documents stored locally</div>
    </div>
    <div v-for="tab in menuTabs" :key="tab.val" class="tab">
      <component :is="tab.icon" class="icon"></component>
      <p class="name">{{ tab.name }}</p>
    </div>
    <div class="section">
      <div class="header">Pinned</div>
      <div class="list">
        <Document class="icon" />
        <div>Latest document appears in the list on the right.</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { menuTabs } from '@/constants/homePage'

defineProps<{
  userName: string
  documentCount: number
}>()
</script>

<style lang="scss" scoped>
.wrapper {
  background-color: #f5f6f7;
  min-width: 250px;
  max-width: 300px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 16px;
  border-right: 1px solid #e5e7eb;
}

.user-card,
.search-card {
  padding: 14px;
  background-color: #fff;
  border-radius: 12px;
  margin-bottom: 16px;
}

.user-title,
.search-title {
  font-size: 12px;
  color: #667085;
  text-transform: uppercase;
}

.user-name {
  margin-top: 6px;
  font-size: 20px;
  font-weight: 700;
}

.search-desc {
  margin-top: 8px;
  color: #475467;
}

.icon {
  width: 20px;
  height: 20px;
  margin-right: 8px;
}

.tab,
.list {
  padding: 8px 10px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  font-size: 16px;
  border-radius: 8px;
}

.tab:hover {
  background-color: #e9eef5;
}

.section {
  margin-top: 20px;
}

.header {
  margin-bottom: 8px;
  font-size: 12px;
  color: #667085;
  text-transform: uppercase;
}

.list {
  color: #475467;
  background: #fff;
}
</style>
