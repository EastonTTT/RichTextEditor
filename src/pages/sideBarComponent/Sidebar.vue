<template>
  <el-aside width="220px" class="sidebar">
    <!-- 用户信息区 -->
    <div class="user-info-box" @click="userInfoDialogVisible = true" style="cursor: pointer;">
      <!-- 使用本地logo.png作为头像 -->
      <el-avatar :src="userAvatar" size="large" style="background: #fff; color: #222129;" />
      <span class="user-name">{{ userName }}</span>
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
      @update:visible="userInfoDialogVisible = $event"
      @save="onUserInfoSave"
    />
  </el-aside>
</template>

<script lang="ts" setup>
import logo from '@/assets/logo.png'
import { ElNotification } from 'element-plus'
import { ref } from 'vue'
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

// 用户名和头像响应式变量（用于展示）
const userName = ref(props.userName)
const userAvatar = ref(logoUrl)

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
function onUserInfoSave(data: { name: string; avatar: string }) {
  userName.value = data.name
  userAvatar.value = data.avatar
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
}

.user-info-box:hover {
  background: rgba(255,255,255,0.25);
}

.user-name {
  font-size: 18px;
  color: #222129;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
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