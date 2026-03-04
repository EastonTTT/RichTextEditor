<template>
  <div class="container">
    <div class="heading-row">
      <div>
        <div class="title">Documents</div>
        <div class="subtitle">Local MVP workspace with create, browse, save and export.</div>
      </div>
      <div class="search-box">
        <el-input :model-value="keyword" placeholder="Search by title or preview" @input="onKeywordChange" clearable />
      </div>
    </div>

    <buttonsPanel @create="emit('create')" />
    <tabBar :model-value="filter" @update:model-value="emit('update:filter', $event)" />

    <resizableTable :columns="columns" :data="rows" @update-column="updateColumn">
      <template #docName="{ row }">
        <div class="doc-cell">
          <div class="doc-title">{{ toDocumentRow(row).title }}</div>
          <div class="doc-preview">{{ toDocumentRow(row).preview }}</div>
        </div>
      </template>
      <template #lastModify="{ row }">
        {{ formatDate(toDocumentRow(row).lastModifiedAt) }}
      </template>
      <template #visibility="{ row }">
        <el-tag :type="toDocumentRow(row).visibility === 'shared' ? 'success' : 'info'">
          {{ toDocumentRow(row).visibility }}
        </el-tag>
      </template>
      <template #action="{ row }">
        <actionMenu
          :row="{ id: toDocumentRow(row).id }"
          @open="emit('open', $event)"
          @rename="emit('rename', $event)"
          @duplicate="emit('duplicate', $event)"
          @delete="emit('delete', $event)"
        />
      </template>
    </resizableTable>

    <el-empty v-if="rows.length === 0" description="No documents found" />
  </div>
</template>

<script setup lang="ts">
import buttonsPanel from './buttonsPanel.vue'
import tabBar from './tabBar.vue'
import resizableTable from '@/components/resizableTable.vue'
import actionMenu from './actionMenu.vue'
import type { tableColumns } from '@/types/resizableTable'
import type { DocumentSummary } from '@/types/document'
import { computed, ref } from 'vue'

const props = defineProps<{
  documents: DocumentSummary[]
  filter: string
  keyword: string
}>()

const emit = defineEmits<{
  create: []
  open: [id: string]
  rename: [id: string]
  duplicate: [id: string]
  delete: [id: string]
  'update:filter': [value: string]
  'update:keyword': [value: string]
}>()

const columns = ref<tableColumns[]>([
  { title: 'Title', key: 'docName', minwidth: 240, width: 360 },
  { title: 'Owner', key: 'author', minwidth: 120, width: 180 },
  { title: 'Visibility', key: 'visibility', minwidth: 120, width: 140 },
  { title: 'Updated', key: 'lastModify', minwidth: 180, width: 220 },
  { title: 'Actions', key: 'action', minwidth: 160, width: 180 },
])

const rows = computed<Record<string, unknown>[]>(() =>
  props.documents.map((document) => ({ ...document })) as Record<string, unknown>[],
)

function updateColumn(index: number, width: number) {
  columns.value[index].width = width
}

function onKeywordChange(value: string) {
  emit('update:keyword', value)
}

function toDocumentRow(row: unknown): DocumentSummary {
  return row as DocumentSummary
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

.search-box {
  width: 320px;
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
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
