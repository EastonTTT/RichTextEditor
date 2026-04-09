<template>
  <div class="login-page">
    <div class="login-shell">
      <section class="intro-panel">
        <div class="eyebrow">本地协同工作台</div>
        <h1 class="hero-title">把文档、知识归档和协作集中到一个空间里</h1>
        <p class="hero-subtitle">
          登录后即可创建文档、归档到知识库，并在共享状态下进行多人协同编辑。
        </p>
        <div class="feature-list">
          <div class="feature-item">
            <span class="feature-dot"></span>
            <span>文档实时协作与自动保存</span>
          </div>
          <div class="feature-item">
            <span class="feature-dot"></span>
            <span>知识库集中归档多篇文档</span>
          </div>
          <div class="feature-item">
            <span class="feature-dot"></span>
            <span>本地账号与独立工作空间</span>
          </div>
        </div>
      </section>

      <section class="login-card">
        <div class="card-title">账号登录</div>
        <div class="card-subtitle">使用本地账号进入工作台</div>
        <el-form class="login-form" @submit.prevent>
          <el-segmented v-model="mode" :options="modeOptions" class="mode-switch" />

          <div class="form-row">
            <label class="form-label" for="login-name">账号</label>
            <el-input id="login-name" v-model="name" maxlength="24" placeholder="请输入账号名称" @keyup.enter="handleLogin" />
          </div>

          <div class="form-row">
            <label class="form-label" for="login-password">密码</label>
            <el-input
              id="login-password"
              v-model="password"
              type="password"
              show-password
              minlength="4"
              placeholder="至少 4 位字符"
              @keyup.enter="handleLogin"
            />
          </div>

          <el-button class="submit-button" type="primary" size="large" :disabled="name.trim().length === 0" @click="handleLogin">
            {{ mode === 'login' ? '登录' : '注册并进入' }}
          </el-button>
        </el-form>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
// 处理落地页中的本地账号登录与注册流程。
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import { getCurrentUser, hasToken, login, register } from '@/api/user'

defineOptions({
  name: 'loginPage',
})

// 登录页同时承接登录和注册，两种模式共用同一份表单。
const route = useRoute()
const router = useRouter()
const mode = ref<'login' | 'register'>('login')
const name = ref('')
const password = ref('')
const modeOptions = [
  {
    label: '登录',
    value: 'login',
  },
  {
    label: '注册',
    value: 'register',
  },
]

async function handleLogin() {
  // 登录成功后优先回跳来源页面，没有 redirect 时再进入首页。
  const trimmedName = name.value.trim()
  if (!trimmedName) {
    ElMessage.warning('请输入账号名称。')
    return
  }

  if (password.value.trim().length < 4) {
    ElMessage.warning('密码至少需要 4 位字符。')
    return
  }

  try {
    if (mode.value === 'login') {
      await login(trimmedName, password.value)
      ElMessage.success(`欢迎回来，${trimmedName}`)
    } else {
      await register(trimmedName, password.value)
      ElMessage.success(`账号已创建：${trimmedName}`)
    }
  } catch (error) {
    const fallbackMessage = mode.value === 'login' ? '登录失败。' : '注册失败。'
    ElMessage.error((error as { msg?: string })?.msg || fallbackMessage)
    return
  }

  const redirect = typeof route.query.redirect === 'string' ? decodeURIComponent(route.query.redirect) : '/home'
  router.replace(redirect)
}

onMounted(async () => {
  // 已登录用户访问登录页时直接重定向，避免重复登录。
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
  padding: 32px;
  background:
    radial-gradient(circle at top left, rgba(23, 92, 230, 0.18), transparent 38%),
    radial-gradient(circle at bottom right, rgba(249, 115, 22, 0.16), transparent 36%),
    linear-gradient(135deg, #f7f8fc 0%, #edf3ff 48%, #f9fafb 100%);
}

.login-shell {
  width: min(1120px, 100%);
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 28px;
  align-items: stretch;
}

.intro-panel,
.login-card {
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(18px);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
}

.intro-panel {
  padding: 42px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.eyebrow {
  display: inline-flex;
  width: fit-content;
  padding: 8px 14px;
  border-radius: 999px;
  background: #ecf3ff;
  color: #175ce6;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.hero-title {
  margin: 18px 0 14px;
  font-size: 42px;
  line-height: 1.14;
  color: #101828;
}

.hero-subtitle {
  margin: 0;
  max-width: 520px;
  color: #475467;
  font-size: 16px;
  line-height: 1.8;
}

.feature-list {
  margin-top: 28px;
  display: grid;
  gap: 14px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #344054;
  font-size: 15px;
}

.feature-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: linear-gradient(135deg, #175ce6, #f97316);
}

.login-card {
  padding: 34px 32px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-title {
  font-size: 30px;
  font-weight: 700;
  color: #101828;
}

.card-subtitle {
  margin-top: 8px;
  color: #667085;
}

.login-form {
  margin-top: 26px;
}

.mode-switch,
.submit-button {
  width: 100%;
}

.form-row {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-top: 16px;
}

.form-label {
  width: 48px;
  flex-shrink: 0;
  color: #344054;
  font-weight: 600;
}

:deep(.el-segmented) {
  border-radius: 16px;
}

:deep(.mode-switch .el-segmented__group) {
  border-radius: 16px;
}

:deep(.el-segmented__item) {
  border-radius: 12px;
}

:deep(.mode-switch .el-segmented__item.is-selected),
:deep(.mode-switch .el-segmented__item-selected) {
  border-radius: 12px;
}

:deep(.el-input) {
  flex: 1;
}

:deep(.el-input__wrapper) {
  min-height: 46px;
  border-radius: 14px;
}

.submit-button {
  margin-top: 22px;
  height: 48px;
  border-radius: 16px;
  font-weight: 700;
}

@media (max-width: 900px) {
  .login-shell {
    grid-template-columns: 1fr;
  }

  .intro-panel {
    padding: 30px;
  }

  .hero-title {
    font-size: 32px;
  }

  .form-row {
    align-items: stretch;
    flex-direction: column;
    gap: 8px;
  }

  .form-label {
    width: auto;
  }
}
</style>
