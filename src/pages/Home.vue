<template>
  <!--
    Home1页面（Element Plus 版）
    用Element Plus组件实现侧边栏、用户信息、菜单、内容区、面包屑和页脚。
    结构与Home.vue一致，风格统一，便于维护。
  -->
  <el-container class="home-container">
    <!-- 侧边栏 -->
    <el-aside width="220px" class="sidebar">
      <!-- 用户信息区 -->
      <div class="user-info-box">
        <!-- 使用本地logo.png作为头像 -->
        <el-avatar :src="logoUrl" size="large" style="background: #fff; color: #222129;" />
        <span class="user-name">代码全都队</span>
      </div>
      <!-- 导航菜单 -->
      <el-menu
        :default-active="activeMenu"
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
        <el-menu-item index="3">
          <span>新建文档</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    <!-- 主内容区 -->
    <el-container class="main-container">
      <el-header class="main-header" />
      <el-main class="main-content">
        <!-- 面包屑导航 -->
        <el-breadcrumb separator="/" class="breadcrumb">
          <el-breadcrumb-item>文档XXXXX</el-breadcrumb-item>
        </el-breadcrumb>
        <!-- 内容展示区 -->
        <div class="content-box">
          测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字 测试文字
        </div>
      </el-main>
      <el-footer class="main-footer">Element Plus ©2024 Created by 代码全都队</el-footer>
    </el-container>
  </el-container>
</template>

<script lang="ts" setup>
/**
 * Home页面（Element Plus 版）
 *
 * 用于展示主布局，包括侧边栏（用户信息、目录树、最近文档、新建文档）和主内容区。
 *
 * @component
 */
import logo from '@/assets/logo.png'
import { ElNotification } from 'element-plus'
import { ref } from 'vue'

// 头像图片地址
const logoUrl = logo

// 当前激活菜单项
const activeMenu = ref('1-1')
// 最近文档列表
const recentDocs = ref([
  '文档A', '文档B', '文档C', '文档D', '文档E', '文档F', '文档G', '文档H'
])

/**
 * 菜单选择事件
 * @input 菜单项index
 * @process 根据index判断点击了哪个菜单，执行对应操作
 * @output 弹窗或跳转（此处为弹窗演示）
 */
function handleMenuSelect(index: string) {
  if (index === '1-1') {
    ElNotification.primary('跳转到知识库列表界面（待实现）')
  } else if (index === '1-2') {
    ElNotification.primary('跳转到文档列表界面（待实现）')
  } else if (index.startsWith('2-')) {
    const idx = Number(index.split('-')[1])
    ElNotification.primary('跳转到' + recentDocs.value[idx] + '界面（待实现）')
  } else if (index === '3') {
    ElNotification.primary('跳转到新建文档界面（待实现）')
  }
}
</script>

<style scoped>
/* 整体容器样式 */
.home-container {
  position: fixed;
  inset: 0;
  display: flex;
  overflow: hidden;
}

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
}
.user-name {
  font-size: 18px;
  color: #222129;
  font-weight: bold;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 主容器样式 */
.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 头部样式 */
.main-header {
  height: 48px;
  background: #fff;
}

/* 主内容区样式 */
.main-content {
  flex: 1;
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* 面包屑样式 */
.breadcrumb {
  margin: 16px 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 内容盒子样式 */
.content-box {
  flex: 1;
  padding: 24px;
  margin-bottom: 16px;
  background: #fff;
  overflow-y: auto;
  word-wrap: break-word;
}

/* 页脚样式 */
.main-footer {
  padding: 20px 0;
  text-align: center;
  background: #f5f5f5;
}

/* 菜单项样式 */
:deep(.el-menu-item),
:deep(.el-sub-menu__title) {
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>