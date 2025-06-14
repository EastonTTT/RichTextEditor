<template>
  <a-layout style="min-height: 100vh">
    <!-- 侧边栏布局 -->
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
      <!-- 用户信息区域（头像、用户名等，暂时留空） -->
      <div class="user-info-box">
        <!-- 头像icon和用户名 -->
        <user-outlined style="font-size: 26px;" />
        <span class="user-name">全组拿offer</span>
      </div>
      <!-- 导航菜单分组 -->
      <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline">
        <!-- 目录树分组，包含两个子目录：知识库列表、文档列表 -->
        <a-sub-menu key="directory-tree">
          <template #title>
            <span>目录树</span>
          </template>
          <a-menu-item key="knowledge-list" @click="onKnowledgeListClick">知识库列表</a-menu-item>
          <a-menu-item key="doc-list" @click="onDocListClick">文档列表</a-menu-item>
        </a-sub-menu>
        <!-- 最近文档分组，最多显示8个最近文档 -->
        <a-sub-menu key="recent-docs">
          <template #title>
            <span>最近文档</span>
          </template>
          <a-menu-item key="recent-1" @click="onRecentDocClick('文档A')">文档A</a-menu-item>
          <a-menu-item key="recent-2" @click="onRecentDocClick('文档B')">文档B</a-menu-item>
          <a-menu-item key="recent-3" @click="onRecentDocClick('文档C')">文档C</a-menu-item>
          <a-menu-item key="recent-4" @click="onRecentDocClick('文档D')">文档D</a-menu-item>
          <a-menu-item key="recent-5" @click="onRecentDocClick('文档E')">文档E</a-menu-item>
          <a-menu-item key="recent-6" @click="onRecentDocClick('文档F')">文档F</a-menu-item>
          <a-menu-item key="recent-7" @click="onRecentDocClick('文档G')">文档G</a-menu-item>
          <a-menu-item key="recent-8" @click="onRecentDocClick('文档H')">文档H</a-menu-item>
        </a-sub-menu>
        <!-- 新建文档按钮，点击后跳转到新建文档界面，阻止高亮 -->
        <a-sub-menu key="create-doc" class="no-arrow-submenu" @click="handleCreateDoc">
          <template #title>
            <span>新建文档</span>
          </template>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header style="background: #fff; padding: 0" />
      <a-layout-content style="margin: 0 16px">
        <a-breadcrumb style="margin: 16px 0">
          <a-breadcrumb-item>文档XXXXX</a-breadcrumb-item>
        </a-breadcrumb>
        <div :style="{ padding: '24px', background: '#fff', minHeight: '360px' }">
          测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字
        </div>
      </a-layout-content>
      <a-layout-footer style="text-align: center">
        Ant Design ©2018 Created by Ant UED
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>
<script lang="ts" setup>
/**
 * Home页面组件
 *
 * 用于展示主布局，包括侧边栏（用户信息、目录树、最近文档、新建文档）和主内容区。
 *
 * @component
 */
import { UserOutlined } from '@ant-design/icons-vue';
import { ref } from 'vue';

// 侧边栏折叠状态
const collapsed = ref<boolean>(false);
// 当前选中的菜单项key
const selectedKeys = ref<string[]>(['knowledge-list']);

/**
 * 新建文档点击事件处理
 * @input 用户点击"新建文档"菜单项
 * @process 1. 主动清空 selectedKeys，使新建文档按钮不再高亮
 *          2. 触发跳转到新建文档界面（此处为占位，后续可补充路由跳转）
 * @output 跳转到新建文档页面
 */
function handleCreateDoc() {
  alert('跳转到新建文档界面（待实现）');
}

/**
 * 知识库列表点击事件
 */
function onKnowledgeListClick() {
  alert('跳转到知识库列表界面（待实现）');
}

/**
 * 文档列表点击事件
 */
function onDocListClick() {
  alert('跳转到文档列表界面（待实现）');
}

/**
 * 最近文档点击事件
 * @input docName 文档名称
 */
function onRecentDocClick(docName: string) {
  alert('跳转到' + docName + '界面（待实现）');
}
</script>
<style scoped>
/* 用户信息盒子样式 */
.user-info-box {
  height: 80px;
  margin: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: space-evenly;
  /* 这里将来可以放头像和用户名 */
}

.user-name {
  font-size: 18px;
  color: #141414;
  font-weight: bold;
}

.site-layout .site-layout-background {
  background: #fff;
}
[data-theme='dark'] .site-layout .site-layout-background {
  background: #141414;
}

:deep(.no-arrow-submenu > .ant-menu-submenu-title .ant-menu-submenu-arrow) {
  display: none !important;
}
</style>
