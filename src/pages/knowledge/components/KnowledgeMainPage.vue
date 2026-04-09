<template>
  <div class="container">
    <div class="heading-row">
      <div>
        <div class="title">知识库</div>
        <div class="subtitle">将多篇文档归档为专题资料，便于集中整理与共享。</div>
      </div>
      <div class="toolbar">
        <div class="search-box">
          <el-input
            :model-value="keyword"
            placeholder="按标题、标签、所有者或归档内容搜索知识库"
            @update:model-value="onKeywordChange"
            clearable
          />
        </div>
        <el-select
          class="tag-filter"
          clearable
          placeholder="按标签筛选"
          :model-value="selectedTag"
          @update:model-value="emit('update:selectedTag', $event || '')"
        >
          <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
        </el-select>
      </div>
    </div>

    <div class="action-row">
      <buttonsPanel
        primary-title="新建知识库"
        primary-description="创建一个知识库，用来归档和管理多篇文档。"
        @create="emit('create')"
      />
    </div>
    <tabBar :model-value="filter" @update:model-value="emit('update:filter', $event)" />

    <div v-if="knowledgeBases.length > 0" class="card-grid">
      <article v-for="knowledgeBase in knowledgeBases" :key="knowledgeBase.id" class="archive-card">
        <div class="archive-head">
          <div>
            <div class="archive-title">{{ knowledgeBase.title }}</div>
            <div class="archive-desc">{{ knowledgeBase.description || '暂无简介' }}</div>
            <div class="owner-line">所有者：{{ knowledgeBase.ownerName }}</div>
          </div>
          <el-tag :type="knowledgeBase.visibility === 'shared' ? 'success' : 'info'">
            {{ knowledgeBase.visibility === 'shared' ? '共享' : '私有' }}
          </el-tag>
        </div>

        <div class="stats-row">
          <div class="stat-box">
            <div class="stat-label">归档文档</div>
            <div class="stat-value">{{ knowledgeBase.relatedDocumentIds.length }}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">标签数量</div>
            <div class="stat-value">{{ knowledgeBase.tags.length }}</div>
          </div>
          <div class="stat-box">
            <div class="stat-label">最近更新</div>
            <div class="stat-value small">{{ formatDate(knowledgeBase.lastModifiedAt) }}</div>
          </div>
        </div>

        <div class="tag-list">
          <el-tag v-for="tag in knowledgeBase.tags" :key="tag" size="small" type="warning">
            {{ tag }}
          </el-tag>
          <span v-if="knowledgeBase.tags.length === 0" class="muted">暂无标签</span>
        </div>

        <div class="card-actions">
          <button class="open-button" type="button" @click="emit('open', knowledgeBase.id)">进入知识库</button>
          <actionMenu
            :row="{ id: knowledgeBase.id }"
            @open="emit('open', $event)"
            @rename="emit('rename', $event)"
            @duplicate="emit('duplicate', $event)"
            @delete="emit('delete', $event)"
          />
        </div>
      </article>
    </div>

    <el-empty v-else description="没有匹配的知识库" />
  </div>
</template>

<script setup lang="ts">
// 展示知识库列表，并提供搜索、标签筛选和快捷操作。
import buttonsPanel from '@/pages/homePage/components/buttonsPanel.vue'
import tabBar from '@/pages/homePage/components/tabBar.vue'
import actionMenu from '@/pages/homePage/components/actionMenu.vue'
import type { KnowledgeBaseSummary } from '@/types/knowledgeBase'

const props = defineProps<{
  knowledgeBases: KnowledgeBaseSummary[]
  filter: string
  keyword: string
  selectedTag: string
  availableTags: string[]
}>()

const emit = defineEmits<{
  create: []
  open: [id: string]
  rename: [id: string]
  duplicate: [id: string]
  delete: [id: string]
  'update:filter': [value: string]
  'update:keyword': [value: string]
  'update:selectedTag': [value: string]
}>()

function onKeywordChange(value: string) {
  emit('update:keyword', value)
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}
</script>

<style lang="scss" scoped>
.container {
  max-width: 1420px;
  margin: 0 auto;
  padding: 18px;
}

.heading-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.title {
  font-size: 34px;
  font-weight: 800;
  color: #101828;
}

.subtitle {
  color: #667085;
  margin-top: 8px;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  width: 360px;
}

.tag-filter {
  width: 200px;
}

.card-grid {
  margin-top: 18px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 18px;
}

.action-row {
  margin-top: 22px;
}

.archive-card {
  padding: 18px;
  border-radius: 22px;
  background:
    radial-gradient(circle at top right, rgba(23, 92, 230, 0.09), transparent 32%),
    linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
  border: 1px solid #dde6f6;
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.08);
}

.archive-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.archive-title {
  font-size: 18px;
  font-weight: 700;
  color: #101828;
}

.archive-desc {
  margin-top: 8px;
  color: #667085;
  font-size: 13px;
  line-height: 1.7;
}

.owner-line {
  margin-top: 10px;
  font-size: 12px;
  color: #175cd3;
  font-weight: 700;
}

.stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 18px;
}

.stat-box {
  padding: 12px;
  border-radius: 16px;
  background: #f8fafc;
}

.stat-label {
  color: #667085;
  font-size: 12px;
}

.stat-value {
  margin-top: 6px;
  font-size: 20px;
  font-weight: 700;
  color: #101828;
}

.stat-value.small {
  font-size: 12px;
  line-height: 1.6;
}

.tag-list {
  margin-top: 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.card-actions {
  margin-top: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.open-button {
  appearance: none;
  border: none;
  background: linear-gradient(135deg, #175ce6, #2f7bff);
  color: #fff;
  padding: 10px 16px;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 700;
  box-shadow: 0 12px 20px rgba(23, 92, 230, 0.18);
}

.muted {
  color: #98a2b3;
  font-size: 12px;
}

@media (max-width: 960px) {
  .heading-row,
  .toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box,
  .tag-filter {
    width: 100%;
  }
}
</style>
