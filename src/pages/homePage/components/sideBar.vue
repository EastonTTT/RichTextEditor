<template>
  <div class="wrapper">
    <div class="brand-card">
      <div class="brand-mark">工作台</div>
      <div class="brand-title">{{ userName }}</div>
      <div class="brand-meta">{{ documentCount }} 篇文档 · {{ knowledgeBaseCount }} 个知识库</div>
      <button class="logout-button" type="button" @click="emit('logout')">退出登录</button>
    </div>

    <div class="nav-card">
      <button
        v-for="tab in menuTabs"
        :key="tab.val"
        class="tab"
        :class="{ active: tab.val === activeTab }"
        type="button"
        @click="emit('navigate', tab.route)"
      >
        <component :is="tab.icon" class="icon"></component>
        <div class="tab-copy">
          <div class="tab-name">{{ tab.name }}</div>
          <div class="tab-desc">{{ tab.val === 'documents' ? '撰写与协作' : '归档与整理' }}</div>
        </div>
      </button>
    </div>

    <div class="section-card">
      <div class="header">最近打开的文档</div>
      <button
        v-for="document in recentDocuments"
        :key="document.id"
        class="recent-item"
        type="button"
        @click="emit('openRecentDocument', document.id)"
      >
        <Document class="icon" />
        <div class="recent-content">
          <div class="recent-title">{{ document.title }}</div>
          <div class="recent-desc">所有者：{{ document.ownerName }}</div>
        </div>
      </button>
      <div v-if="recentDocuments.length === 0" class="empty-state">
        暂无最近文档
      </div>
    </div>

    <div class="section-card">
      <div class="header">最近打开的知识库</div>
      <button
        v-for="knowledgeBase in recentKnowledgeBases"
        :key="knowledgeBase.id"
        class="recent-item"
        type="button"
        @click="emit('openRecentKnowledgeBase', knowledgeBase.id)"
      >
        <Collection class="icon" />
        <div class="recent-content">
          <div class="recent-title">{{ knowledgeBase.title }}</div>
          <div class="recent-desc">所有者：{{ knowledgeBase.ownerName }}</div>
        </div>
      </button>
      <div v-if="recentKnowledgeBases.length === 0" class="empty-state">
        暂无最近知识库
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { menuTabs } from '@/constants/homePage'
import type { RecentDocumentItem } from '@/types/document'
import type { RecentKnowledgeBaseItem } from '@/types/knowledgeBase'

defineProps<{
  activeTab: string
  userName: string
  documentCount: number
  knowledgeBaseCount: number
  recentDocuments: RecentDocumentItem[]
  recentKnowledgeBases: RecentKnowledgeBaseItem[]
}>()

const emit = defineEmits<{
  logout: []
  navigate: [path: string]
  openRecentDocument: [id: string]
  openRecentKnowledgeBase: [id: string]
}>()
</script>

<style lang="scss" scoped>
.wrapper {
  width: 310px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 20px;
  background:
    linear-gradient(180deg, #0f172a 0%, #13213d 28%, #f4f7fb 28%, #f4f7fb 100%);
  border-right: 1px solid #e5e7eb;
}

.brand-card,
.nav-card,
.section-card {
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
}

.brand-card {
  padding: 20px;
  color: #101828;
}

.brand-mark {
  display: inline-flex;
  padding: 6px 12px;
  border-radius: 999px;
  background: #e8efff;
  color: #175ce6;
  font-size: 12px;
  font-weight: 700;
}

.brand-title {
  margin-top: 14px;
  font-size: 24px;
  font-weight: 700;
}

.brand-meta {
  margin-top: 6px;
  color: #667085;
  font-size: 13px;
}

.logout-button {
  margin-top: 16px;
  appearance: none;
  border: 1px solid #d0d5dd;
  background: #fff;
  border-radius: 12px;
  padding: 10px 14px;
  cursor: pointer;
  color: #344054;
}

.nav-card,
.section-card {
  padding: 14px;
}

.tab {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: none;
  border-radius: 14px;
  background: transparent;
  cursor: pointer;
  text-align: left;
}

.tab + .tab {
  margin-top: 8px;
}

.tab:hover {
  background: #f5f8ff;
}

.tab.active {
  background: linear-gradient(135deg, #175ce6, #2f7bff);
  color: #fff;
}

.tab.active .tab-desc {
  color: rgba(255, 255, 255, 0.78);
}

.tab-copy {
  min-width: 0;
}

.tab-name {
  font-size: 15px;
  font-weight: 700;
}

.tab-desc {
  margin-top: 2px;
  color: #667085;
  font-size: 12px;
}

.icon {
  width: 18px;
  height: 18px;
  flex-shrink: 0;
}

.header {
  margin-bottom: 10px;
  color: #667085;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.recent-item {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  text-align: left;
}

.recent-item:hover {
  background: #f5f8ff;
}

.recent-item + .recent-item {
  margin-top: 8px;
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
  margin-top: 3px;
  font-size: 12px;
  color: #667085;
}

.empty-state {
  padding: 12px;
  border-radius: 12px;
  background: #f8fafc;
  color: #98a2b3;
  font-size: 13px;
}
</style>
