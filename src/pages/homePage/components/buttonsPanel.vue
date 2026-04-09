<template>
  <div class="wrapper">
    <button class="button primary" @click="emit('create')">
      <div class="icon">
        <DocumentAdd />
      </div>
      <div class="text">
        <div class="title">{{ primaryTitle }}</div>
        <div class="desc">{{ primaryDescription }}</div>
      </div>
    </button>

    <button class="button secondary" type="button" @click="emit('import')">
      <div class="icon">
        <UploadFilled />
      </div>
      <div class="text">
        <div class="title">导入文档</div>
        <div class="desc">从本地文件导入新文档</div>
      </div>
    </button>

    <button class="button secondary" type="button" @click="emit('template')">
      <div class="icon">
        <MessageBox />
      </div>
      <div class="text">
        <div class="title">从模板新建文档</div>
        <div class="desc">从已有的模板文档中创建新文档</div>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
// 首页和知识库页都复用这组快捷入口按钮，因此文案允许通过 props 覆写。
withDefaults(
  defineProps<{
    primaryTitle?: string
    primaryDescription?: string
  }>(),
  {
    primaryTitle: '新建文档',
    primaryDescription: '创建一篇空白文档并立即进入编辑页。',
  },
)

const emit = defineEmits<{
  create: []
  import: []
  template: []
}>()
</script>

<style lang="scss" scoped>
.wrapper {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.button {
  appearance: none;
  background: #fff;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid #e4e7ec;
  min-height: 96px;
  display: flex;
  align-items: center;
  text-align: left;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.button:hover {
  cursor: pointer;
  transform: translateY(-1px);
  box-shadow: 0 16px 28px rgba(15, 23, 42, 0.08);
}

.button.primary {
  border-color: #bfd3ff;
  background: linear-gradient(135deg, #f3f8ff 0%, #eef6ff 100%);
}

.button.secondary {
  background: #fff;
}

.icon {
  width: 38px;
  height: 38px;
  margin-right: 14px;
  color: #175ce6;
}

.text {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.title {
  font-size: 15px;
  font-weight: 700;
  color: #101828;
}

.desc {
  font-size: 12px;
  color: #667085;
  line-height: 1.6;
}

@media (max-width: 960px) {
  .wrapper {
    grid-template-columns: 1fr;
  }
}
</style>
