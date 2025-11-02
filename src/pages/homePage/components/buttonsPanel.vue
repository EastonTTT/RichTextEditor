<template>
  <div class="wrapper">
    <div class="button" v-for="(cont, index) in conts" :key="index">
      <div class="icon">
        <component :is="cont.icon" />
      </div>
      <div class="text">
        <div class="title">{{ cont.title }}</div>
        <div class="desc">{{ cont.desc }}</div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">

const conts = [
  {
    icon: 'DocumentAdd',
    title: '新建',
    desc: '新建文档开始写作',
  },
  {
    icon: 'UploadFilled',
    title: '上传',
    desc: '上传本地文件',
  },
  {
    icon: 'MessageBox',
    title: '模板库',
    desc: '选择模板快速新建',
  }
]

</script>

<style lang="scss" scoped>
.wrapper {
  display: flex;
  align-items: center;

  .button {
    padding: 5px;
    border-radius: 10px;
    border: 1px solid #dee0e3;
    flex: 1;
    min-width: 200px;
    max-width: 400px;
    height: 60px;
    display: flex;
    align-items: center;
    margin-right: 20px;

    &:hover {
      cursor: pointer;
      background-color: #edeeee;
    }

    .icon {
      width: 30px;
      height: 30px;
      margin-right: 10px;
    }

    .text {
      .title {
        font-size: 14px;
        margin-bottom: 5px;
      }

      .desc {
        font-size: 12px;
        color: #646f7c;
      }
    }
  }
}
</style>
