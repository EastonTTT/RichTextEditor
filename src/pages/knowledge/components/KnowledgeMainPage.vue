<template>
  <div class="container">
    <div class="heading-row">
      <div>
        <div class="title">Knowledge Base</div>
        <div class="subtitle">Create living notes backed by CRDT synchronization.</div>
      </div>
      <div class="toolbar">
        <div class="search-box">
          <el-input
            :model-value="keyword"
            placeholder="Search by title, description, preview or tags"
            @input="onKeywordChange"
            clearable
          />
        </div>
        <el-select
          class="tag-filter"
          clearable
          placeholder="Filter by tag"
          :model-value="selectedTag"
          @update:model-value="emit('update:selectedTag', $event || '')"
        >
          <el-option v-for="tag in availableTags" :key="tag" :label="tag" :value="tag" />
        </el-select>
      </div>
    </div>

    <buttonsPanel
      primary-title="New Knowledge Note"
      primary-description="Create a reusable note and open it immediately."
      @create="emit('create')"
    />
    <tabBar :model-value="filter" @update:model-value="emit('update:filter', $event)" />

    <resizableTable :columns="columns" :data="rows" @update-column="updateColumn">
      <template #docName="{ row }">
        <div class="doc-cell">
          <div class="doc-title">{{ toKnowledgeBaseRow(row).title }}</div>
          <div class="doc-preview">{{ toKnowledgeBaseRow(row).description }}</div>
        </div>
      </template>
      <template #tags="{ row }">
        <div class="tag-list">
          <el-tag v-for="tag in toKnowledgeBaseRow(row).tags" :key="tag" size="small" type="warning">
            {{ tag }}
          </el-tag>
          <span v-if="toKnowledgeBaseRow(row).tags.length === 0" class="muted">No tags</span>
        </div>
      </template>
      <template #relations="{ row }">
        <div class="relation-summary">
          <span>{{ toKnowledgeBaseRow(row).relatedDocumentIds.length }} docs</span>
          <span>{{ toKnowledgeBaseRow(row).relatedKnowledgeBaseIds.length }} notes</span>
        </div>
      </template>
      <template #lastModify="{ row }">
        {{ formatDate(toKnowledgeBaseRow(row).lastModifiedAt) }}
      </template>
      <template #visibility="{ row }">
        <el-tag :type="toKnowledgeBaseRow(row).visibility === 'shared' ? 'success' : 'info'">
          {{ toKnowledgeBaseRow(row).visibility }}
        </el-tag>
      </template>
      <template #action="{ row }">
        <actionMenu
          :row="{ id: toKnowledgeBaseRow(row).id }"
          @open="emit('open', $event)"
          @rename="emit('rename', $event)"
          @duplicate="emit('duplicate', $event)"
          @delete="emit('delete', $event)"
        />
      </template>
    </resizableTable>

    <el-empty v-if="rows.length === 0" description="No knowledge notes found" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import buttonsPanel from '@/pages/homePage/components/buttonsPanel.vue'
import tabBar from '@/pages/homePage/components/tabBar.vue'
import resizableTable from '@/components/resizableTable.vue'
import actionMenu from '@/pages/homePage/components/actionMenu.vue'
import type { tableColumns } from '@/types/resizableTable'
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

const columns = ref<tableColumns[]>([
  { title: 'Title', key: 'docName', minwidth: 240, width: 300 },
  { title: 'Tags', key: 'tags', minwidth: 180, width: 220 },
  { title: 'Relations', key: 'relations', minwidth: 160, width: 180 },
  { title: 'Visibility', key: 'visibility', minwidth: 120, width: 140 },
  { title: 'Updated', key: 'lastModify', minwidth: 180, width: 220 },
  { title: 'Actions', key: 'action', minwidth: 160, width: 180 },
])

const rows = computed<Record<string, unknown>[]>(() =>
  props.knowledgeBases.map((knowledgeBase) => ({ ...knowledgeBase })) as Record<string, unknown>[],
)

function updateColumn(index: number, width: number) {
  columns.value[index].width = width
}

function onKeywordChange(value: string) {
  emit('update:keyword', value)
}

function toKnowledgeBaseRow(row: unknown): KnowledgeBaseSummary {
  return row as KnowledgeBaseSummary
}

function formatDate(value: string) {
  return new Date(value).toLocaleString()
}
</script>

<style lang="scss" scoped>
.container {
  padding: 10px;
}

.heading-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.title {
  font-size: 28px;
  font-weight: 700;
}

.subtitle {
  color: #667085;
  margin-top: 6px;
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

.doc-cell {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.doc-title {
  font-weight: 600;
}

.doc-preview {
  color: #667085;
  font-size: 12px;
}

.tag-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}

.relation-summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
  color: #475467;
  font-size: 12px;
}

.muted {
  color: #98a2b3;
  font-size: 12px;
}
</style>
