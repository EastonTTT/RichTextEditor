<template>
  <div class="container">
    <div class="heading-row">
      <div>
        <div class="title">文档中心</div>
        <div class="subtitle">撰写、整理和共享你的本地文档。</div>
      </div>
      <div class="search-box">
        <el-input :model-value="keyword" placeholder="按标题、所有者或内容搜索文档" @update:model-value="onKeywordChange" clearable />
      </div>
    </div>

    <div class="actions-block">
      <buttonsPanel @create="emit('create')" @import="emit('import')" @template="emit('template')" />
    </div>
    <tabBar :model-value="filter" @update:model-value="emit('update:filter', $event)" />

    <section class="shared-panel">
      <div class="shared-panel-header">
        <div>
          <div class="shared-title">共享文档</div>
          <div class="shared-subtitle">这些文档已经开放协作，可由多个账号共同编辑。</div>
        </div>
        <el-tag type="success">{{ sharedRows.length }}</el-tag>
      </div>
      <div v-if="sharedRows.length > 0" class="shared-list">
        <button
          v-for="document in sharedRows"
          :key="document.id"
          class="shared-card"
          type="button"
          @click="emit('open', document.id)"
        >
          <div class="shared-card-title">{{ document.title }}</div>
          <div class="shared-card-meta">
            <span>所有者：{{ document.ownerName }}</span>
            <span>{{ formatDate(document.lastModifiedAt) }}</span>
          </div>
          <div class="shared-card-preview">{{ document.preview || '这是一篇可协作的共享文档。' }}</div>
        </button>
      </div>
      <el-empty v-else description="当前没有共享文档" />
    </section>

    <div class="table-card">
      <resizableTable :columns="columns" :data="rows" @update-column="updateColumn">
        <template #docName="{ row }">
          <button class="doc-link" type="button" @click="emit('open', toDocumentRow(row).id)">
            <div class="doc-title">{{ toDocumentRow(row).title }}</div>
            <div class="doc-preview">{{ toDocumentRow(row).preview }}</div>
          </button>
        </template>
        <template #lastModify="{ row }">
          {{ formatDate(toDocumentRow(row).lastModifiedAt) }}
        </template>
        <template #visibility="{ row }">
          <el-tag :type="toDocumentRow(row).visibility === 'shared' ? 'success' : 'info'">
            {{ toDocumentRow(row).visibility === 'shared' ? '共享' : '私有' }}
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
    </div>

    <el-empty v-if="rows.length === 0" description="没有匹配的文档" />
  </div>
</template>

<script setup lang="ts">
// 渲染文档中心列表、筛选条件和共享文档卡片。
import buttonsPanel from './buttonsPanel.vue'
import tabBar from './tabBar.vue'
import resizableTable from '@/components/resizableTable.vue'
import actionMenu from './actionMenu.vue'
import type { tableColumns } from '@/types/resizableTable'
import type { DocumentSummary } from '@/types/document'
import { computed, ref } from 'vue'

const props = defineProps<{
  documents: DocumentSummary[]
  sharedDocuments: DocumentSummary[]
  filter: string
  keyword: string
}>()

const emit = defineEmits<{
  create: []
  import: []
  template: []
  open: [id: string]
  rename: [id: string]
  duplicate: [id: string]
  delete: [id: string]
  'update:filter': [value: string]
  'update:keyword': [value: string]
}>()

const columns = ref<tableColumns[]>([
  { title: '标题', key: 'docName', minwidth: 260, width: 360 },
  { title: '所有者', key: 'ownerName', minwidth: 140, width: 180 },
  { title: '可见性', key: 'visibility', minwidth: 120, width: 140 },
  { title: '更新时间', key: 'lastModify', minwidth: 180, width: 220 },
  { title: '操作', key: 'action', minwidth: 160, width: 180 },
])

// 表格数据做一层浅映射，便于和可拖拽表格组件的通用 row 结构对齐。
const rows = computed<Record<string, unknown>[]>(() =>
  props.documents.map((document) => ({ ...document })) as Record<string, unknown>[],
)

const sharedRows = computed(() => props.sharedDocuments)

function updateColumn(index: number, width: number) {
  // 列宽由父组件持有，拖拽后直接覆写对应列配置即可。
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
  margin-top: 10px;
}

.search-box {
  width: 360px;
}

.actions-block {
  margin-top: 24px;
}

.shared-panel,
.table-card {
  margin-top: 20px;
  padding: 18px;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 16px 30px rgba(15, 23, 42, 0.06);
}

.shared-panel {
  background: linear-gradient(180deg, #f8fbff 0%, #eef4ff 100%);
}

.shared-panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 14px;
}

.shared-title {
  font-size: 17px;
  font-weight: 700;
}

.shared-subtitle {
  margin-top: 4px;
  color: #667085;
  font-size: 13px;
}

.shared-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}

.shared-card {
  appearance: none;
  text-align: left;
  padding: 16px;
  border: 1px solid #c7d7fe;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.96);
  cursor: pointer;
}

.shared-card-title {
  font-size: 15px;
  font-weight: 700;
  color: #101828;
}

.shared-card-meta {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  color: #475467;
  font-size: 12px;
}

.shared-card-preview {
  margin-top: 12px;
  color: #667085;
  font-size: 12px;
  line-height: 1.6;
}

.doc-link {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 0;
  border: none;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.doc-title {
  font-weight: 700;
  color: #101828;
}

.doc-preview {
  color: #667085;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 960px) {
  .heading-row {
    flex-direction: column;
  }

  .search-box {
    width: 100%;
  }
}
</style>
