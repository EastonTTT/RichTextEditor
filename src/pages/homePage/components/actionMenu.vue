<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <button class="action-button" type="button">更多操作</button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="open">打开</el-dropdown-item>
        <el-dropdown-item command="rename">重命名</el-dropdown-item>
        <el-dropdown-item command="duplicate">复制</el-dropdown-item>
        <el-dropdown-item command="delete" class="danger">删除</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
// 提供打开、重命名、复制、删除等行级操作。
type ActionCommand = 'open' | 'rename' | 'duplicate' | 'delete'

const props = defineProps<{
  row: {
    id: string
  }
}>()

const emit = defineEmits<{
  open: [id: string]
  rename: [id: string]
  duplicate: [id: string]
  delete: [id: string]
}>()

function handleCommand(command: ActionCommand) {
  if (command === 'open') {
    emit('open', props.row.id)
    return
  }

  if (command === 'rename') {
    emit('rename', props.row.id)
    return
  }

  if (command === 'duplicate') {
    emit('duplicate', props.row.id)
    return
  }

  emit('delete', props.row.id)
}
</script>

<style lang="scss" scoped>
.action-button {
  appearance: none;
  border: 1px solid #d0d7de;
  border-radius: 999px;
  background: #fff;
  padding: 8px 14px;
  cursor: pointer;
  color: #344054;
}

.action-button:hover {
  background: #f8fafc;
}
</style>
