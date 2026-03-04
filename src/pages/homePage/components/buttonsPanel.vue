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
    <div class="button" v-for="(action, index) in secondaryActions" :key="index">
      <div class="icon">
        <component :is="action.icon" />
      </div>
      <div class="text">
        <div class="title">{{ action.title }}</div>
        <div class="desc">{{ action.desc }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    primaryTitle?: string
    primaryDescription?: string
  }>(),
  {
    primaryTitle: 'New Document',
    primaryDescription: 'Create a blank document and open it immediately.',
  },
)

const emit = defineEmits<{
  create: []
}>()

const secondaryActions = [
  {
    icon: 'UploadFilled',
    title: 'Import',
    desc: 'Reserved for importing local files in the next iteration.',
  },
  {
    icon: 'MessageBox',
    title: 'Templates',
    desc: 'Reserved for document templates in the next iteration.',
  },
]
</script>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  align-items: center;
  gap: 16px;
}

.button {
  appearance: none;
  background: #fff;
  padding: 5px;
  border-radius: 10px;
  border: 1px solid #dee0e3;
  flex: 1;
  min-width: 200px;
  max-width: 400px;
  height: 60px;
  display: flex;
  align-items: center;
  text-align: left;
}

.button:hover {
  cursor: pointer;
  background-color: #edeeee;
}

.button.primary {
  border-color: #1677ff;
  background: #f4f8ff;
}

.icon {
  width: 30px;
  height: 30px;
  margin-right: 10px;
}

.title {
  font-size: 14px;
  margin-bottom: 5px;
}

.desc {
  font-size: 12px;
  color: #646f7c;
}
</style>
