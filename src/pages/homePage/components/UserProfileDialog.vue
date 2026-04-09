<template>
  <el-dialog
    :model-value="visible"
    title="编辑个人资料"
    width="420px"
    :close-on-click-modal="false"
    @close="closeDialog"
  >
    <el-form label-position="top">
      <el-form-item label="登录名">
        <el-input :model-value="userName" readonly />
      </el-form-item>

      <el-form-item label="显示昵称">
        <el-input v-model="form.nickname" maxlength="40" placeholder="输入你希望显示的昵称" />
      </el-form-item>

      <el-form-item label="头像">
        <div class="avatar-row">
          <el-avatar :src="form.avatar || undefined" :size="56">
            {{ displayInitial }}
          </el-avatar>
          <el-upload
            :show-file-list="false"
            accept="image/*"
            :before-upload="beforeAvatarUpload"
            :on-change="handleAvatarChange"
          >
            <el-button>上传头像</el-button>
          </el-upload>
          <el-button text @click="form.avatar = ''">清空</el-button>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="closeDialog">取消</el-button>
      <el-button type="primary" :loading="loading" @click="saveProfile">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
// 允许当前用户编辑昵称和头像信息。
import { computed, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

const props = withDefaults(
  defineProps<{
    visible: boolean
    userName: string
    nickname?: string
    avatar?: string
    loading?: boolean
  }>(),
  {
    nickname: '',
    avatar: '',
    loading: false,
  },
)

const emit = defineEmits<{
  'update:visible': [value: boolean]
  save: [payload: { nickname: string; avatar: string }]
}>()

const form = ref({
  nickname: '',
  avatar: '',
})

const displayInitial = computed(() => {
  const value = form.value.nickname.trim() || props.userName.trim()
  return value.slice(0, 1).toUpperCase()
})

watch(
  () => props.visible,
  (visible) => {
    if (!visible) {
      return
    }

    form.value = {
      nickname: props.nickname || props.userName,
      avatar: props.avatar || '',
    }
  },
  { immediate: true },
)

function closeDialog() {
  emit('update:visible', false)
}

function beforeAvatarUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.warning('只能上传图片文件。')
  }
  return isImage
}

function handleAvatarChange(uploadFile: { raw?: File }) {
  if (!uploadFile.raw) {
    ElMessage.error('读取图片失败。')
    return
  }

  const reader = new FileReader()
  reader.onload = (event) => {
    const result = typeof event.target?.result === 'string' ? event.target.result : ''
    if (!result.startsWith('data:image/')) {
      ElMessage.error('头像格式转换失败。')
      return
    }

    form.value.avatar = result
  }
  reader.onerror = () => {
    ElMessage.error('读取图片失败。')
  }
  reader.readAsDataURL(uploadFile.raw)
}

function saveProfile() {
  const nickname = form.value.nickname.trim()
  if (!nickname) {
    ElMessage.warning('昵称不能为空。')
    return
  }

  emit('save', {
    nickname,
    avatar: form.value.avatar,
  })
}
</script>

<style scoped>
.avatar-row {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
