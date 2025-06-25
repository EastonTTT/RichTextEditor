<template>
  <div class="editor-header">
    <div class="left-side">
      <div class="left-icon">
        <button>
          <HomeIcon size="large" />
        </button>
        <button>
          <UserListIcon />
        </button>
      </div>
      <div class="breadcrumb">
        <el-breadcrumb :separator-icon="ArrowRight">
          <el-breadcrumb-item :to="{ path: '/' }">homepage</el-breadcrumb-item>
          <el-breadcrumb-item>user-name</el-breadcrumb-item>
          <el-breadcrumb-item>Knowledge Base</el-breadcrumb-item>
          <el-breadcrumb-item>Document Name</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
    </div>
    <div class="right-side">
      <div class="collaborators">
        <p>collaborators:</p>
        <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="avatar" />
        <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="avatar" />
        <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="avatar" />
        <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="avatar" />
        <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="avatar" />
        <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" class="avatar" />
      </div>
      <div class="right-button">
        <button>
          <SaveIcon size="large" />
        </button>
        <button>
          <FileExportIcon size="large" />
        </button>
        <button>
          <SearchIcon size="large" />
        </button>
      </div>
      <div class="avatar">
        <el-avatar src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  HomeIcon,
  SaveIcon,
  SearchIcon,
  UserListIcon,
  FileExportIcon
} from 'tdesign-icons-vue-next';
import { ArrowRight } from '@element-plus/icons-vue'
</script>

<style lang="scss" scoped>
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 20px;
  margin-bottom: 1%;
  min-height: 70px;
  border: 1px solid #ccc;
  position: sticky;
  top: 0;
  align-self: flex-start;
  height: fit-content;
  background-color: #fff;
  /* 为 header 添加背景颜色 */
}

.left-side {
  display: flex;
  align-items: center;
}

.left-icon {
  border-right: 1px solid #ccc;
  margin-right: 20px;
  display: flex;
  align-items: center;
}

.breadcrumb {
  margin-left: 20px;
}

.right-side {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.right-button {
  display: flex;
  align-items: center;
  margin-right: 20px;


}

.avatar {
  margin: 0 8px;
  display: flex;
  align-items: center;
}

.collaborators {
  p {
    color: #a1a1a1;
  }

  display: flex;
  align-items: center;
  margin-right: 20px;

  .avatar {
    margin: 0 4px;
    border: 2px solid #fff;
  }
}

button {
  all: unset;
  cursor: pointer;
  padding: 5px;
  background-color: transparent;
  display: inline-block;
  margin: 0 4px;
  transition: transform 0.3s ease, background-color 0.3s ease;
  border-radius: 10%;
  display: flex;
  align-items: center;
  justify-content: center;
}

button:hover {
  background-color: #f0f0f0;
  transform: scale(1.1);
}
</style>
