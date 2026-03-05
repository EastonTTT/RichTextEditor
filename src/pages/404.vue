<template>
  <div class="not-found-page">
    <div class="card">
      <div class="code">404</div>
      <div class="title">页面不存在</div>
      <div class="desc">你访问的地址无法找到，可能已被移动或删除。</div>
      <router-link class="back-link" to="/home">返回工作台</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
defineOptions({
  name: 'notFound',
})
</script>

<style scoped>
.not-found-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(180deg, #f4f7fb 0%, #eef2f8 100%);
}

.card {
  padding: 36px;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 20px 36px rgba(15, 23, 42, 0.08);
  text-align: center;
}

.code {
  font-size: 56px;
  font-weight: 800;
  color: #175ce6;
}

.title {
  margin-top: 10px;
  font-size: 26px;
  font-weight: 700;
  color: #101828;
}

.desc {
  margin-top: 10px;
  color: #667085;
}

.back-link {
  display: inline-flex;
  margin-top: 22px;
  padding: 10px 16px;
  border-radius: 12px;
  background: #175ce6;
  color: #fff;
  text-decoration: none;
}
</style>
