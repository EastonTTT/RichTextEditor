<template>
  <el-dropdown trigger="click" @command="handleCommand">
    <button class="action-button" type="button">Actions</button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item command="open">Open</el-dropdown-item>
        <el-dropdown-item command="rename">Rename</el-dropdown-item>
        <el-dropdown-item command="duplicate">Duplicate</el-dropdown-item>
        <el-dropdown-item command="delete" class="danger">Delete</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup lang="ts">
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
  padding: 6px 12px;
  cursor: pointer;
}

.action-button:hover {
  background: #f8fafc;
}
</style>
