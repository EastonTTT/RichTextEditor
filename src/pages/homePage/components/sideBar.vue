<template>
  <div class="wrapper">
    <div class="user-card">
      <div class="user-title">Workspace</div>
      <div class="user-name-row">
        <div class="user-name">{{ userName }}</div>
        <button class="logout-button" type="button" @click="emit('logout')">Log out</button>
      </div>
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
      <div class="header">Recent</div>
      <button
        v-for="document in recentDocuments"
        :key="document.id"
        class="recent-item"
        type="button"
        @click="emit('openRecent', document.id)"
      >
        <Document class="icon" />
        <div class="recent-content">
          <div class="recent-title">{{ document.title }}</div>
          <div class="recent-desc">Open recent document</div>
        </div>
      </button>
      <div v-if="recentDocuments.length === 0" class="list empty-state">
        <Document class="icon" />
        <div>No recent documents yet.</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { menuTabs } from '@/constants/homePage'
import type { RecentDocumentItem } from '@/types/document'

defineProps<{
  userName: string
  documentCount: number
  recentDocuments: RecentDocumentItem[]
}>()

const emit = defineEmits<{
  logout: []
  openRecent: [id: string]
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

.user-name-row {
  margin-top: 6px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.user-name {
  font-size: 20px;
  font-weight: 700;
}

.logout-button {
  appearance: none;
  border: 1px solid #d0d5dd;
  background: #fff;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
  color: #344054;
}

.logout-button:hover {
  background: #f8fafc;
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
.list,
.recent-item {
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

.recent-item {
  width: 100%;
  appearance: none;
  border: none;
  background: #fff;
  text-align: left;
  color: #475467;
  cursor: pointer;
}

.recent-item:hover {
  background-color: #eef4ff;
}

.recent-content {
  min-width: 0;
}

.recent-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d2939;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.recent-desc {
  margin-top: 2px;
  font-size: 12px;
  color: #667085;
}

.empty-state {
  font-size: 14px;
}
</style>
