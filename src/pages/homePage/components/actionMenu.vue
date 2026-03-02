<template>
  <div class="menu">
    <button class="action-button" @click.stop="emit('open', row.id)">Open</button>
    <button class="action-button danger" @click.stop="emit('delete', row.id)">Delete</button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  row: {
    id: string
  }
}>()

const emit = defineEmits<{
  open: [id: string]
  delete: [id: string]
}>()
</script>

<style lang="scss" scoped>
.menu {
  display: flex;
  gap: 8px;
}

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

.danger {
  color: #b42318;
}
</style>
