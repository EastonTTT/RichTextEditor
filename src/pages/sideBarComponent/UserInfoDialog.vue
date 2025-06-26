<script setup lang="ts">
/**
 * UserInfoDialog 用户信息设置对话框组件
 *
 * 用于设置和修改用户的头像和用户名，仅在前端生效
 * 新增退出登录功能
 *
 * @component
 */

import logo from '@/assets/logo.png'
import { useUserStore } from '@/stores/user'
import { ElMessageBox, ElNotification } from 'element-plus'
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'

/**
 * UserInfoDialogProps接口
 *
 * @property {boolean} visible - 对话框显示状态
 * @property {string} userName - 当前用户名
 * @property {string} userAvatar - 当前用户头像
 * @property {boolean} [loading] - 是否处于加载中状态
 */
interface UserInfoDialogProps {
  visible: boolean
  userName: string
  userAvatar: string
  loading?: boolean
}

const props = withDefaults(defineProps<UserInfoDialogProps>(), {
  loading: false
})
const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'save', data: { name: string; avatar: string }): void
}>()

const router = useRouter()
const userStore = useUserStore()

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
  if (!isImage) {
    ElNotification.warning('只能上传图片文件')
  }
  return isImage
}

/**
 * 头像上传并本地预览
 *
 * @param uploadFile 上传的文件对象
 */
function handleAvatarChange(uploadFile: any) {
  if (!uploadFile.raw) {
    ElNotification.error('文件上传失败')
    return
  }

  const reader = new FileReader()

  reader.onload = (e: any) => {
    try {
      const base64Data = e.target.result
      // 检查base64数据的格式是否正确
      if (!base64Data || typeof base64Data !== 'string' || !base64Data.startsWith('data:image/')) {
        ElNotification.error('图片格式转换失败')
        return
      }

      console.log('Base64数据长度:', base64Data.length)
      console.log('Base64数据前100个字符:', base64Data.substring(0, 100))

      userInfoForm.value.avatar = base64Data
    } catch (error) {
      console.error('处理头像数据时出错:', error)
      ElNotification.error('处理头像失败')
    }
  }

  reader.onerror = (error) => {
    console.error('读取文件失败:', error)
    ElNotification.error('读取文件失败')
  }

  try {
    reader.readAsDataURL(uploadFile.raw)
  } catch (error) {
    console.error('启动文件读取时出错:', error)
    ElNotification.error('无法读取文件')
  }
}

/**
 * 保存用户信息
 */
function saveUserInfo() {
  if (!userInfoForm.value.name.trim()) {
    ElNotification.warning('昵称不能为空')
    return
  }

  // 添加头像数据检查
  if (userInfoForm.value.avatar) {
    console.log('准备发送的头像数据长度:', userInfoForm.value.avatar.length)
    console.log('头像数据前缀:', userInfoForm.value.avatar.substring(0, 30))
  }

  emit('save', {
    name: userInfoForm.value.name,
    avatar: userInfoForm.value.avatar || logo
  })
  emit('update:visible', false)
}

/**
 * 退出登录
 *
 * @input 无
 * @process 1. 显示确认对话框
 *          2. 用户确认后清除登录状态
 *          3. 跳转到登录页面
 * @output 退出登录成功提示
 */
async function handleLogout() {
  try {
    await ElMessageBox.confirm(
      '确定要退出登录吗？',
      '退出登录',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    // 清除用户登录状态
    userStore.logout()

    // 关闭对话框
    emit('update:visible', false)

    // 跳转到登录页面
    router.push('/')

    ElNotification.success('已退出登录')
  } catch {
    // 用户取消退出
  }
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
      <el-form-item label="昵称">
        <el-input v-model="userInfoForm.name" maxlength="255" show-word-limit />
      </el-form-item>
    </el-form>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="closeDialog">取消</el-button>
        <el-button type="primary" @click="saveUserInfo" :loading="props.loading">保存</el-button>
        <el-button type="danger" @click="handleLogout">退出登录</el-button>
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
