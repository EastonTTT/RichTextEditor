<script setup lang="ts">
/**
 * UserInfoDialog 用户信息设置对话框组件
 *
 * 用于设置和修改用户的头像和用户名，仅在前端生效
 *
 * @component
 */

import logo from '@/assets/logo.png'
import { ElNotification } from 'element-plus'
import { ref, watch } from 'vue'

/**
 * UserInfoDialogProps接口
 *
 * @property {boolean} visible - 对话框显示状态
 * @property {string} userName - 当前用户名
 * @property {string} userAvatar - 当前用户头像
 */
interface UserInfoDialogProps {
  visible: boolean
  userName: string
  userAvatar: string
}

const props = defineProps<UserInfoDialogProps>()
const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'save', data: { name: string; avatar: string }): void
}>()

const userInfoForm = ref({
  name: props.userName,
  avatar: props.userAvatar
})

watch(
  () => props.visible,
  (val) => {
    if (val) {
      userInfoForm.value.name = props.userName
      userInfoForm.value.avatar = props.userAvatar
    }
  }
)

/**
 * 关闭对话框
 */
function closeDialog() {
  emit('update:visible', false)
}

/**
 * 头像上传前校验
 */
function beforeAvatarUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) {
    ElNotification.warning('只能上传图片文件')
  }
  if (!isLt2M) {
    ElNotification.warning('图片大小不能超过2MB')
  }
  return isImage && isLt2M
}

/**
 * 头像上传并本地预览
 */
function handleAvatarChange(uploadFile: any) {
  const reader = new FileReader()
  reader.onload = (e: any) => {
    userInfoForm.value.avatar = e.target.result
  }
  reader.readAsDataURL(uploadFile.raw)
}

/**
 * 保存用户信息
 */
function saveUserInfo() {
  if (!userInfoForm.value.name.trim()) {
    ElNotification.warning('用户名不能为空')
    return
  }
  emit('save', {
    name: userInfoForm.value.name,
    avatar: userInfoForm.value.avatar || logo
  })
  emit('update:visible', false)
  ElNotification.success('用户信息已更新')
}
</script>

<template>
  <el-dialog
    :model-value="props.visible"
    title="设置用户信息"
    width="400px"
    :close-on-click-modal="false"
    @close="closeDialog"
  >
    <el-form :model="userInfoForm" label-width="80px">
      <el-form-item label="头像">
        <el-upload
          class="avatar-uploader"
          :show-file-list="false"
          :before-upload="beforeAvatarUpload"
          :on-change="handleAvatarChange"
          accept="image/*"
        >
          <el-avatar :src="userInfoForm.avatar || logo" size="large" style="cursor:pointer;" />
        </el-upload>
      </el-form-item>
      <el-form-item label="用户名">
        <el-input v-model="userInfoForm.name" maxlength="10" show-word-limit />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveUserInfo">保存</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<style scoped>
.avatar-uploader .el-upload {
  border: none;
  background: none;
}
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
