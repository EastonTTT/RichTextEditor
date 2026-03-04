<template>
  <div class="login-page">
    <div class="login-card">
      <div class="title">Rich Text Editor MVP</div>
      <div class="subtitle">Enter a display name to start a local session.</div>
      <el-form @submit.prevent>
        <el-form-item label="Display Name">
          <el-input v-model="name" maxlength="24" placeholder="Easton" @keyup.enter="handleLogin" />
        </el-form-item>
        <el-button type="primary" size="large" :disabled="name.trim().length === 0" @click="handleLogin">
          Continue
        </el-button>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { getCurrentUser, hasToken, login } from '@/api/user'

defineOptions({
  name: 'loginPage',
})

const route = useRoute()
const router = useRouter()
const name = ref('')

async function handleLogin() {
  const trimmedName = name.value.trim()
  if (!trimmedName) {
    ElMessage.warning('Please enter a display name.')
    return
  }

  await login(trimmedName)
  ElMessage.success(`Welcome back, ${trimmedName}.`)
  const redirect = typeof route.query.redirect === 'string' ? decodeURIComponent(route.query.redirect) : '/home'
  router.replace(redirect)
}

onMounted(async () => {
  if (!hasToken()) {
    return
  }

  const user = await getCurrentUser()
  name.value = user.name
  const redirect = typeof route.query.redirect === 'string' ? decodeURIComponent(route.query.redirect) : '/home'
  router.replace(redirect)
})
</script>

<style lang="scss" scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #eef4ff 100%);
}

.login-card {
  width: 420px;
  background: #fff;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.08);
}

.title {
  font-size: 28px;
  font-weight: 700;
}

.subtitle {
  margin: 8px 0 24px;
  color: #667085;
}
</style>
