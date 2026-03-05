<template>
  <div class="knowledge-editor-page">
    <header class="archive-header">
      <div class="header-main">
        <button class="back-button" type="button" @click="router.push('/knowledge')">返回</button>
        <div class="title-group">
          <el-input
            v-model="titleDraft"
            class="title-input"
            size="large"
            @focus="isTitleFocused = true"
            @blur="handleTitleBlur"
            @input="handleTitleInput"
          />
          <div class="header-meta">
            <span>{{ saveStatusLabel }}</span>
            <span class="dot">|</span>
            <span>所有者：{{ ownerName }}</span>
            <span class="dot">|</span>
            <span>{{ visibility === 'shared' ? '共享知识库' : '私有知识库' }}</span>
            <span class="dot">|</span>
            <span>{{ relatedDocumentIds.length }} 篇归档文档</span>
          </div>
        </div>
      </div>

      <div class="header-actions">
        <div class="online-panel" v-if="collaborators.length > 0">
          <span class="online-label">在线 {{ collaborators.length }} 人</span>
          <div class="online-list">
            <span
              v-for="collaborator in collaborators"
              :key="`${collaborator.name}-${collaborator.color}`"
              class="online-chip"
              :style="{ '--chip-color': collaborator.color, borderColor: collaborator.color }"
            >
              {{ collaborator.name }}
            </span>
          </div>
        </div>

        <el-select class="visibility-select" :model-value="visibility" @update:model-value="handleVisibilityChange">
          <el-option label="私有" value="private" />
          <el-option label="共享" value="shared" />
        </el-select>
        <button class="save-button" type="button" :disabled="isSaving" @click="saveCurrentKnowledgeBase(true)">保存</button>
      </div>
    </header>

    <div class="archive-layout">
      <section class="summary-panel card">
        <div class="section-title">知识库简介</div>
        <el-input
          type="textarea"
          :rows="4"
          :model-value="description"
          placeholder="说明这个知识库的主题、范围和使用方式。"
          @input="handleDescriptionChange"
        />

        <div class="field-block">
          <div class="field-label">标签</div>
          <el-input :model-value="tagsInput" placeholder="例如：项目复盘，接口设计，调研" @input="handleTagsInput" />
        </div>

        <div class="stats-grid">
          <div class="stat-item">
            <div class="stat-label">归档文档</div>
            <div class="stat-value">{{ relatedDocumentIds.length }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">标签数量</div>
            <div class="stat-value">{{ tags.length }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">最近保存</div>
            <div class="stat-value small">{{ lastSavedAt ? new Date(lastSavedAt).toLocaleString() : '尚未保存' }}</div>
          </div>
          <div class="stat-item owner-card">
            <div class="stat-label">所有者</div>
            <div class="stat-value small strong">{{ ownerName }}</div>
          </div>
        </div>
      </section>

      <section class="archive-panel card">
        <div class="section-head">
          <div>
            <div class="section-title">已归档文档</div>
            <div class="section-subtitle">这里展示当前知识库收录的文档。</div>
          </div>
          <el-input
            class="doc-search"
            :model-value="documentSearch"
            placeholder="搜索可归档文档"
            @input="documentSearch = $event"
          />
        </div>

        <div v-if="selectedDocuments.length > 0" class="document-grid selected-grid">
          <article v-for="document in selectedDocuments" :key="document.id" class="document-card selected">
            <div class="document-top">
              <div>
                <div class="document-title">{{ document.title }}</div>
                <div class="document-preview">{{ document.preview }}</div>
              </div>
              <el-tag :type="document.visibility === 'shared' ? 'success' : 'info'">
                {{ document.visibility === 'shared' ? '共享' : '私有' }}
              </el-tag>
            </div>
            <div class="document-foot">
              <button class="ghost-button" type="button" @click="router.push(`/documents/${document.id}`)">打开文档</button>
              <button class="danger-button" type="button" @click="removeArchivedDocument(document.id)">移出知识库</button>
            </div>
          </article>
        </div>
        <el-empty v-else description="当前还没有归档文档" />
      </section>

      <section class="picker-panel card">
        <div class="section-head compact">
          <div>
            <div class="section-title">添加文档到知识库</div>
            <div class="section-subtitle">从你的文档列表中选择需要归档的内容。</div>
          </div>
        </div>

        <div class="document-grid">
          <article
            v-for="document in availableDocuments"
            :key="document.id"
            class="document-card"
            :class="{ active: relatedDocumentIds.includes(document.id) }"
          >
            <div class="document-top">
              <div>
                <div class="document-title">{{ document.title }}</div>
                <div class="document-preview">{{ document.preview }}</div>
              </div>
              <el-tag :type="document.visibility === 'shared' ? 'success' : 'info'">
                {{ document.visibility === 'shared' ? '共享' : '私有' }}
              </el-tag>
            </div>
            <div class="document-foot">
              <button class="ghost-button" type="button" @click="router.push(`/documents/${document.id}`)">查看</button>
              <button class="primary-button" type="button" @click="toggleArchivedDocument(document.id)">
                {{ relatedDocumentIds.includes(document.id) ? '已归档' : '加入知识库' }}
              </button>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script lang="ts" setup>
import * as Y from 'yjs'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { getDocumentList } from '@/api/document'
import { getKnowledgeBaseDetail, recordKnowledgeBaseOpen, saveKnowledgeBase } from '@/api/knowledgeBase'
import type { DocumentSummary, DocumentVisibility } from '@/types/document'
import { arraysEqual, normalizeVisibility, readStringArray, setMetaValueIfChanged } from '@/utils/collaborationMeta'
import { getStoredToken, getStoredUser } from '@/utils/localStore'
import { useCollaborationProvider } from '@/utils/useCollaborationProvider'

type CollaboratorPresence = {
  name: string
  color: string
}

const route = useRoute()
const router = useRouter()
const knowledgeBaseId = route.params.id as string
const collabUrl = import.meta.env.VITE_COLLAB_WS_URL as string | undefined
const roomName = `knowledge:${knowledgeBaseId}`
const storedUser = getStoredUser()
const storedToken = getStoredToken() || undefined

const sharedDoc = collabUrl ? new Y.Doc() : null
const metaMap = sharedDoc?.getMap<unknown>('meta') ?? null
const collaboration = collabUrl && sharedDoc
  ? useCollaborationProvider({
      wsUrl: collabUrl,
      roomName,
      doc: sharedDoc,
      token: storedToken,
      user: {
        name: storedUser.name,
        color: storedUser.color,
      },
      autoConnect: false,
    })
  : null

const title = ref('未命名知识库')
const titleDraft = ref('未命名知识库')
const isTitleFocused = ref(false)
const ownerName = ref(storedUser.name)
const description = ref('用于归档同一主题下的多篇文档。')
const tags = ref<string[]>([])
const relatedDocumentIds = ref<string[]>([])
const documentOptions = ref<DocumentSummary[]>([])
const visibility = ref<DocumentVisibility>('private')
const persistedVisibility = ref<DocumentVisibility>('private')
const isSaving = ref(false)
const isDirty = ref(false)
const lastSavedAt = ref('')
const saveError = ref('')
const isCollaborative = ref(false)
const hasReceivedInitialSync = ref(false)
const hasSeededCollaborationState = ref(false)
const queuedSave = ref(false)
const documentSearch = ref('')
const collaborators = ref<CollaboratorPresence[]>([])
let autoSaveTimer: number | null = null
let suppressMetaObserver = false

const tagsInput = computed(() => tags.value.join('，'))
const canCollaborate = computed(() => Boolean(collaboration) && visibility.value === 'shared' && persistedVisibility.value === 'shared')
const saveStatusLabel = computed(() => {
  if (saveError.value) {
    return saveError.value
  }

  if (isSaving.value) {
    return '正在保存...'
  }

  if (isDirty.value) {
    return '有变更待保存'
  }

  if (!lastSavedAt.value) {
    return '尚未保存'
  }

  return `上次保存：${new Date(lastSavedAt.value).toLocaleString()}`
})

const selectedDocuments = computed(() =>
  documentOptions.value.filter((document) => relatedDocumentIds.value.includes(document.id)),
)

const availableDocuments = computed(() => {
  const normalizedKeyword = documentSearch.value.trim().toLowerCase()
  return documentOptions.value.filter((document) => {
    if (normalizedKeyword.length === 0) {
      return true
    }

    return (
      document.title.toLowerCase().includes(normalizedKeyword) ||
      document.preview.toLowerCase().includes(normalizedKeyword) ||
      document.ownerName.toLowerCase().includes(normalizedKeyword) ||
      (document.content || '').toLowerCase().includes(normalizedKeyword)
    )
  })
})

function syncTitleDraft(force = false) {
  if (force || !isTitleFocused.value || titleDraft.value === title.value) {
    titleDraft.value = title.value
  }
}

function readMetaIntoState() {
  if (!metaMap) {
    return
  }

  const nextTitle = metaMap.get('title')
  const nextDescription = metaMap.get('description')
  const nextVisibility = metaMap.get('visibility')
  const nextTags = readStringArray(metaMap.get('tags'))
  const nextRelatedDocumentIds = readStringArray(metaMap.get('relatedDocumentIds'))

  if (typeof nextTitle === 'string' && nextTitle.trim()) {
    title.value = nextTitle
  }

  if (typeof nextDescription === 'string') {
    description.value = nextDescription
  }

  if (metaMap.has('tags')) {
    tags.value = nextTags
  }

  if (metaMap.has('relatedDocumentIds')) {
    relatedDocumentIds.value = nextRelatedDocumentIds
  }

  if (metaMap.has('visibility')) {
    visibility.value = normalizeVisibility(nextVisibility)
  }

  syncTitleDraft()
}

function syncStateIntoMeta() {
  if (!metaMap) {
    return
  }

  setMetaValueIfChanged(metaMap, 'title', title.value)
  setMetaValueIfChanged(metaMap, 'description', description.value)
  setMetaValueIfChanged(metaMap, 'tags', tags.value)
  setMetaValueIfChanged(metaMap, 'relatedDocumentIds', relatedDocumentIds.value)
  setMetaValueIfChanged(metaMap, 'visibility', visibility.value)
}

function applyMetaObserver() {
  readMetaIntoState()

  if (!suppressMetaObserver && hasSeededCollaborationState.value) {
    markDirty()
  }
}

async function seedSharedMetaFromSnapshot() {
  if (!canCollaborate.value || !hasReceivedInitialSync.value || hasSeededCollaborationState.value) {
    return
  }

  suppressMetaObserver = true

  if (metaMap && metaMap.size > 0) {
    readMetaIntoState()
  } else {
    syncStateIntoMeta()
  }

  suppressMetaObserver = false
  hasSeededCollaborationState.value = true
  isDirty.value = false
}

function syncCollaborationMode() {
  if (!collaboration) {
    return
  }

  if (!canCollaborate.value) {
    collaboration.disconnect()
    isCollaborative.value = false
    collaborators.value = []
    hasReceivedInitialSync.value = false
    hasSeededCollaborationState.value = false
    return
  }

  collaboration.connect()
}

async function loadReferenceOptions() {
  documentOptions.value = await getDocumentList()
}

async function hydrateKnowledgeBase() {
  const knowledgeBase = await getKnowledgeBaseDetail(knowledgeBaseId)

  if (!knowledgeBase) {
    router.replace('/notFound')
    return
  }

  title.value = knowledgeBase.title
  ownerName.value = knowledgeBase.ownerName
  description.value = knowledgeBase.description
  tags.value = knowledgeBase.tags
  relatedDocumentIds.value = knowledgeBase.relatedDocumentIds
  visibility.value = knowledgeBase.visibility
  persistedVisibility.value = knowledgeBase.visibility
  lastSavedAt.value = knowledgeBase.lastModifiedAt
  saveError.value = ''
  syncTitleDraft(true)

  syncCollaborationMode()
}

function clearAutoSaveTimer() {
  if (autoSaveTimer) {
    window.clearTimeout(autoSaveTimer)
    autoSaveTimer = null
  }
}

function scheduleAutoSave() {
  clearAutoSaveTimer()
  autoSaveTimer = window.setTimeout(() => {
    void saveCurrentKnowledgeBase()
  }, 900)
}

function markDirty() {
  isDirty.value = true
  saveError.value = ''

  if (isSaving.value) {
    queuedSave.value = true
    return
  }

  scheduleAutoSave()
}

async function saveCurrentKnowledgeBase(force = false) {
  if (isSaving.value) {
    queuedSave.value = true
    return
  }

  if (!force && !isDirty.value) {
    return
  }

  clearAutoSaveTimer()
  isSaving.value = true
  saveError.value = ''

  try {
    const knowledgeBase = await saveKnowledgeBase(knowledgeBaseId, {
      title: title.value,
      description: description.value,
      tags: tags.value,
      relatedDocumentIds: relatedDocumentIds.value,
      relatedKnowledgeBaseIds: [],
      visibility: visibility.value,
    })

    title.value = knowledgeBase.title
    ownerName.value = knowledgeBase.ownerName
    description.value = knowledgeBase.description
    tags.value = knowledgeBase.tags
    relatedDocumentIds.value = knowledgeBase.relatedDocumentIds
    visibility.value = knowledgeBase.visibility
    persistedVisibility.value = knowledgeBase.visibility
    lastSavedAt.value = knowledgeBase.lastModifiedAt
    isDirty.value = false
    syncTitleDraft()
    syncCollaborationMode()
  } catch {
    saveError.value = '保存失败，当前修改仍保留在本地。'
    isDirty.value = true
  } finally {
    isSaving.value = false

    if (queuedSave.value) {
      queuedSave.value = false
      if (isDirty.value) {
        scheduleAutoSave()
      }
    }
  }
}

function handleTitleInput(value: string) {
  titleDraft.value = value
  title.value = value

  if (metaMap && hasReceivedInitialSync.value) {
    setMetaValueIfChanged(metaMap, 'title', value)
  }

  markDirty()
}

function handleTitleBlur() {
  isTitleFocused.value = false
  syncTitleDraft(true)
}

function handleDescriptionChange(value: string) {
  description.value = value

  if (metaMap && hasReceivedInitialSync.value) {
    setMetaValueIfChanged(metaMap, 'description', value)
  }

  markDirty()
}

function handleTagsInput(value: string) {
  const nextTags = value
    .split(/[，,]/)
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 12)

  if (arraysEqual(tags.value, nextTags)) {
    return
  }

  tags.value = nextTags

  if (metaMap && hasReceivedInitialSync.value) {
    setMetaValueIfChanged(metaMap, 'tags', nextTags)
  }

  markDirty()
}

function handleVisibilityChange(value: DocumentVisibility) {
  visibility.value = value

  if (metaMap && hasReceivedInitialSync.value) {
    setMetaValueIfChanged(metaMap, 'visibility', value)
  }

  syncCollaborationMode()
  markDirty()
}

function toggleArchivedDocument(id: string) {
  const nextValue = relatedDocumentIds.value.includes(id)
    ? relatedDocumentIds.value.filter((documentId) => documentId !== id)
    : [...relatedDocumentIds.value, id]

  relatedDocumentIds.value = nextValue

  if (metaMap && hasReceivedInitialSync.value) {
    setMetaValueIfChanged(metaMap, 'relatedDocumentIds', nextValue)
  }

  markDirty()
}

function removeArchivedDocument(id: string) {
  if (!relatedDocumentIds.value.includes(id)) {
    return
  }

  relatedDocumentIds.value = relatedDocumentIds.value.filter((documentId) => documentId !== id)

  if (metaMap && hasReceivedInitialSync.value) {
    setMetaValueIfChanged(metaMap, 'relatedDocumentIds', relatedDocumentIds.value)
  }

  markDirty()
}

function handleCollaborationStatus(event: { status: 'connected' | 'disconnected' | 'connecting' }) {
  if (!canCollaborate.value) {
    isCollaborative.value = false
    collaborators.value = []
    return
  }

  isCollaborative.value = event.status === 'connected'
  syncCollaborators()
}

function handleCollaborationSync(isSynced: boolean) {
  hasReceivedInitialSync.value = isSynced
  if (isSynced) {
    void seedSharedMetaFromSnapshot()
  }
}

function syncCollaborators() {
  if (!collaboration || !isCollaborative.value || !canCollaborate.value) {
    collaborators.value = []
    return
  }

  const seen = new Set<string>()
  const nextCollaborators: CollaboratorPresence[] = []

  collaboration.awareness.getStates().forEach((state) => {
    const user = state.user
    if (!user || typeof user.name !== 'string' || !user.name.trim()) {
      return
    }

    const entry = {
      name: user.name.trim(),
      color: typeof user.color === 'string' && user.color ? user.color : '#1677ff',
    }
    const key = `${entry.name}:${entry.color}`
    if (seen.has(key)) {
      return
    }

    seen.add(key)
    nextCollaborators.push(entry)
  })

  collaborators.value = nextCollaborators
}

onBeforeRouteLeave(() => {
  if (!isDirty.value) {
    return true
  }

  return window.confirm('当前修改尚未保存，确认离开吗？')
})

onMounted(async () => {
  if (collaboration) {
    collaboration.provider.on('status', handleCollaborationStatus)
    collaboration.provider.on('sync', handleCollaborationSync)
    collaboration.awareness.on('change', syncCollaborators)
  }

  metaMap?.observe(applyMetaObserver)

  await Promise.all([recordKnowledgeBaseOpen(knowledgeBaseId), loadReferenceOptions()])
  await hydrateKnowledgeBase()
})

onBeforeUnmount(() => {
  clearAutoSaveTimer()
  metaMap?.unobserve(applyMetaObserver)

  if (collaboration) {
    collaboration.provider.off('status', handleCollaborationStatus)
    collaboration.provider.off('sync', handleCollaborationSync)
    collaboration.awareness.off('change', syncCollaborators)
    collaboration.destroy()
  }

  sharedDoc?.destroy()
})
</script>

<style lang="scss" scoped>
.knowledge-editor-page {
  min-height: 100vh;
  padding: 24px;
  background:
    radial-gradient(circle at top left, rgba(23, 92, 230, 0.12), transparent 28%),
    radial-gradient(circle at right center, rgba(249, 115, 22, 0.12), transparent 24%),
    linear-gradient(180deg, #f4f7fb 0%, #eef2f8 100%);
}

.card {
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 18px 32px rgba(15, 23, 42, 0.06);
}

.archive-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 24px;
  border-radius: 28px;
  background:
    linear-gradient(135deg, rgba(23, 92, 230, 0.08), rgba(249, 115, 22, 0.08)),
    rgba(255, 255, 255, 0.94);
  box-shadow: 0 22px 44px rgba(15, 23, 42, 0.08);
}

.header-main,
.header-actions {
  display: flex;
  gap: 14px;
}

.header-main {
  flex: 1;
}

.title-group {
  flex: 1;
}

.title-input {
  max-width: 560px;
}

.header-meta {
  margin-top: 10px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  color: #667085;
  font-size: 12px;
}

.dot {
  color: #d0d5dd;
}

.back-button,
.save-button,
.ghost-button,
.primary-button,
.danger-button {
  appearance: none;
  cursor: pointer;
}

.back-button {
  height: 40px;
  border: 1px solid #d0d5dd;
  border-radius: 10px;
  background: #fff;
  padding: 0 16px;
}

.save-button,
.primary-button {
  height: 40px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #175ce6, #2f7bff);
  color: #fff;
  padding: 0 16px;
  font-weight: 700;
}

.ghost-button {
  border: 1px solid #d0d5dd;
  border-radius: 10px;
  background: #fff;
  padding: 9px 14px;
  color: #344054;
}

.danger-button {
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fff5f5;
  color: #b42318;
  padding: 9px 14px;
}

.header-actions {
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.visibility-select {
  width: 112px;
}

:deep(.visibility-select .el-select__wrapper) {
  min-height: 40px;
  border-radius: 10px;
}

.online-panel {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 14px;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
}

.online-label {
  font-size: 12px;
  color: #475467;
}

.online-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.online-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 999px;
  border: 1px solid #d0d5dd;
  background: #fff;
  font-size: 12px;
}

.online-chip::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 999px;
  background: var(--chip-color);
}

.archive-layout {
  margin-top: 22px;
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 20px;
}

.summary-panel,
.archive-panel,
.picker-panel {
  padding: 22px;
}

.summary-panel {
  align-self: start;
  background:
    radial-gradient(circle at top right, rgba(23, 92, 230, 0.08), transparent 34%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.archive-panel,
.picker-panel {
  grid-column: 2;
  position: relative;
  overflow: hidden;
}

.archive-panel::before,
.picker-panel::before {
  content: '';
  position: absolute;
  inset: 0 0 auto 0;
  height: 4px;
  background: linear-gradient(90deg, #175ce6, #f97316);
}

.section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-head.compact {
  margin-bottom: 14px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #101828;
}

.section-subtitle {
  margin-top: 6px;
  font-size: 13px;
  color: #667085;
}

.field-block {
  margin-top: 18px;
}

.field-label {
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 700;
  color: #344054;
}

.stats-grid {
  margin-top: 20px;
  display: grid;
  gap: 12px;
}

.stat-item {
  padding: 14px;
  border-radius: 16px;
  background: #f8fafc;
}

.owner-card {
  background: linear-gradient(180deg, #eff6ff 0%, #f7fbff 100%);
}

.stat-label {
  color: #667085;
  font-size: 12px;
}

.stat-value {
  margin-top: 6px;
  font-size: 22px;
  font-weight: 700;
  color: #101828;
}

.stat-value.small {
  font-size: 12px;
  line-height: 1.7;
}

.stat-value.strong {
  font-size: 14px;
  color: #175cd3;
  font-weight: 700;
}

.doc-search {
  width: 280px;
}

.document-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 14px;
}

.selected-grid {
  margin-bottom: 6px;
}

.document-card {
  padding: 16px;
  border-radius: 18px;
  border: 1px solid #e4e7ec;
  background: linear-gradient(180deg, #ffffff 0%, #fbfdff 100%);
}

.document-card.active {
  border-color: #bfd3ff;
  background: #f6f9ff;
}

.document-card.selected {
  background: #fcfdff;
}

.document-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.document-title {
  font-size: 15px;
  font-weight: 700;
  color: #101828;
}

.document-preview {
  margin-top: 8px;
  color: #667085;
  font-size: 12px;
  line-height: 1.6;
}

.document-foot {
  margin-top: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

@media (max-width: 1180px) {
  .archive-layout {
    grid-template-columns: 1fr;
  }

  .archive-panel,
  .picker-panel {
    grid-column: auto;
  }
}

@media (max-width: 900px) {
  .knowledge-editor-page {
    padding: 16px;
  }

  .archive-header,
  .header-main,
  .header-actions,
  .section-head {
    flex-direction: column;
    align-items: stretch;
  }

  .doc-search,
  .title-input {
    width: 100%;
    max-width: none;
  }
}
</style>
