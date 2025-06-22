<template>
  <el-aside width="220px" class="sidebar">
    <!-- 用户信息区 -->
    <div
      class="user-info-box"
      :class="{ 'guest-mode': isGuest }"
      @click="handleUserInfoClick"
      style="cursor: pointer;"
    >
      <!-- 使用本地logo.png作为头像 -->
      <el-avatar :src="userAvatar" size="large" style="background: #fff; color: #222129;" />
      <span class="user-name">{{ displayUserName }}</span>
      <!-- 游客标识 -->
      <el-tag v-if="isGuest" size="small" type="warning" class="guest-tag">游客</el-tag>
    </div>

    <!-- 导航菜单 -->
    <el-menu
      :default-active="activeMenu"
      :default-openeds="['1']"
      class="el-menu-vertical-demo"
      background-color="#132b3e"
      text-color="#fff"
      active-text-color="#ffd04b"
      @select="handleMenuSelect"
      :unique-opened="true"
      style="border-right: none;"
    >
      <!-- 目录树分组 -->
      <el-sub-menu index="1">
        <template #title>
          <span>目录树</span>
        </template>
        <el-menu-item index="1-1">知识库列表</el-menu-item>
        <el-menu-item index="1-2">文档列表</el-menu-item>
      </el-sub-menu>

      <!-- 最近文档分组 -->
      <el-sub-menu index="2">
        <template #title>
          <span>最近文档</span>
        </template>
        <el-menu-item v-for="(doc, idx) in recentDocs" :key="doc" :index="`2-${idx}`">{{ doc }}</el-menu-item>
      </el-sub-menu>

      <!-- 新建文档按钮 -->
      <el-menu-item index="3" @click="openCreateDocument">
        <span>新建文档</span>
      </el-menu-item>
    </el-menu>

    <!-- 新建文档对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="新建文档"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="文档名称" required>
          <el-input
            v-model="createForm.name"
            placeholder="请输入文档名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="所属知识库" required>
          <el-select v-model="createForm.knowledgeBase" placeholder="请选择知识库" style="width: 100%">
            <el-option
              v-for="item in knowledgeBaseOptions"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="closeCreateDialog">取消</el-button>
          <el-button type="primary" @click="createDocument">创建</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 设置用户信息对话框（抽离为组件） -->
    <UserInfoDialog
      :visible="userInfoDialogVisible"
      :userName="userName"
      :userAvatar="userAvatar"
      :loading="isSavingUserInfo"
      @update:visible="userInfoDialogVisible = $event"
      @save="onUserInfoSave"
    />
  </el-aside>
</template>

<script lang="ts" setup>
import { updateUserProfile } from '@/api/user'
import logo from '@/assets/logo.png'
import { useUserStore } from '@/stores/user'
import { ElMessageBox, ElNotification } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import UserInfoDialog from './UserInfoDialog.vue'

// 定义组件名称
defineOptions({
  name: 'SidebarComponent'
})

// 定义组件属性
interface Props {
  userName?: string
  activeMenu?: string
  recentDocs?: string[]
  knowledgeBaseOptions?: Array<{ value: string; label: string }>
}

// 设置默认值
const props = withDefaults(defineProps<Props>(), {
  userName: '代码全都队',
  activeMenu: '1',
  recentDocs: () => ['文档A', '文档B', '文档C', '文档D', '文档E', '文档F', '文档G', '文档H'],
  knowledgeBaseOptions: () => [
    { value: 'knowledgeBase1', label: '知识库A' },
    { value: 'knowledgeBase2', label: '知识库B' },
    { value: 'knowledgeBase3', label: '知识库C' }
  ]
})

// 定义事件
const emit = defineEmits<{
  menuSelect: [index: string]
  createDocument: [documentData: { name: string; knowledgeBase: string }]
}>()

// 创建router实例
const router = useRouter()
const userStore = useUserStore()

// 头像图片地址
const logoUrl = logo

// 对话框相关
const createDialogVisible = ref(false)
const createForm = ref({
  name: '',
  knowledgeBase: '',
})

// 用户信息对话框相关
const userInfoDialogVisible = ref(false)
const isSavingUserInfo = ref(false)

// 用户名和头像改为从store获取的计算属性
const userName = computed(() => userStore.userInfo.nickname || userStore.userInfo.username)
const userAvatar = computed(() => userStore.userInfo.avatar || logoUrl)

/**
 * 计算属性：是否为游客模式
 */
const isGuest = computed(() => userStore.isGuest)

/**
 * 计算属性：显示的用户名
 */
const displayUserName = computed(() => {
  const name = isGuest.value ? '游客用户' : userName.value;
  return name.length > 7 ? name.substring(0, 7) + '...' : name;
})

/**
 * 初始化用户状态
 */
onMounted(() => {
  userStore.initUserState()
})

/**
 * 处理用户信息区域点击
 *
 * @input 无
 * @process 1. 检查是否为游客模式
 *          2. 游客模式弹出确认框提示登录
 *          3. 已登录用户打开设置对话框
 * @output 提示信息或打开对话框
 */
async function handleUserInfoClick() {
  if (isGuest.value) {
    try {
      await ElMessageBox.confirm(
        '您当前为游客模式，请登录后使用完整功能。',
        '需要登录',
        {
          confirmButtonText: '前往登录',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
      // 用户点击"前往登录"后，跳转到登录页
      router.push('/')
    } catch {
      // 用户点击了"取消"或关闭了弹窗
      ElNotification.info('操作已取消')
    }
    return
  }
  // 如果是已登录用户，则正常打开信息设置对话框
  userInfoDialogVisible.value = true
}

/**
 * 菜单选择事件
 * @param index 菜单项index
 */
function handleMenuSelect(index: string) {
  emit('menuSelect', index)

  if (index === '1-1') {
    router.push('/storelist')
  } else if (index === '1-2') {
    router.push('/doclist')
  } else if (index.startsWith('2-')) {
    const idx = Number(index.split('-')[1])
    ElNotification.primary('跳转到' + props.recentDocs[idx] + '界面（待实现）')
  }
}

/**
 * 打开新建文档对话框
 */
function openCreateDocument() {
  createDialogVisible.value = true
  // 重置表单
  createForm.value = {
    name: '',
    knowledgeBase: '',
  }
}

/**
 * 关闭新建文档对话框
 */
function closeCreateDialog() {
  createDialogVisible.value = false
}

/**
 * 创建文档
 */
function createDocument() {
  if (!createForm.value.name.trim()) {
    ElNotification.warning('请输入文档名称')
    return
  }

  if (!createForm.value.knowledgeBase) {
    ElNotification.warning('请选择所属知识库')
    return
  }

  // 触发创建文档事件
  emit('createDocument', {
    name: createForm.value.name,
    knowledgeBase: createForm.value.knowledgeBase
  })

  // 显示成功提示
  ElNotification.success('文档创建成功！')

  // 关闭对话框
  closeCreateDialog()
}

/**
 * 用户信息保存回调
 */
async function onUserInfoSave(data: { name: string; avatar: string }) {
  if (isGuest.value) {
    ElNotification.error('游客无法保存信息')
    return
  }
  isSavingUserInfo.value = true
  try {
    const response = await updateUserProfile({
      username: userStore.userInfo.username, // 使用username进行用户识别
      nickname: data.name,
      avatar: data.avatar
    })

    if (response.data.success) {
      // 修正：根据后端的返回，从 response.data.user 中获取更新后的用户数据
      const updatedUserData = response.data.user || {};

      // 使用从后端返回的最新数据更新store
      userStore.updateUserInfo({
        nickname: updatedUserData.nickname || data.name,
        avatar: updatedUserData.avatar || data.avatar
      });

      ElNotification.success('用户信息更新成功！');
      userInfoDialogVisible.value = false // 成功后关闭对话框
    } else {
      ElNotification.error(response.data.message || '更新失败')
    }
  } catch (error) {
    // Axios拦截器会自动处理网络错误等提示，这里只在控制台打印详细错误
    console.error('Update user info error:', error)
  } finally {
    isSavingUserInfo.value = false // 无论成功或失败，都结束加载状态
  }
}
</script>

<style scoped>
/* 侧边栏样式 */
.sidebar {
  width: 220px;
  background: #334b5e;
  color: #fff;
  overflow-y: auto;
}

/* 用户信息盒子样式 */
.user-info-box {
  height: 80px;
  margin: 16px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  cursor: pointer;
  transition: background 0.2s;
  position: relative;
}

.user-info-box:hover {
  background: rgba(255,255,255,0.25);
}

/* 游客模式样式 */
.user-info-box.guest-mode {
  background: rgba(255, 193, 7, 0.2);
  border: 1px solid rgba(255, 193, 7, 0.3);
}

.user-info-box.guest-mode:hover {
  background: rgba(255, 193, 7, 0.3);
}

.user-name {
  font-size: 18px;
  color: #222129;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 游客标签样式 */
.guest-tag {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 10px;
}

/* 菜单项样式 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 对话框样式 */
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.avatar-uploader .el-upload {
  border: none;
  background: none;
}
</style>
