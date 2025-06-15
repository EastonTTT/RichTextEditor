<!-- <template>
  <div>
    <p>temp homepage..</p>
    <el-button @click="gotomainbox" type="primary">登录</el-button>
  </div>
</template>

<script>
export default {
  methods: {
    gotomainbox() {
      this.$router.push('/mainbox');
    }
  }
}
</script>

<style></style> -->

<template>
  <div class="login-register">
    <div class="container">
      <div class="form-container">
        <div class="form" :class="{ 'slide-right': !isLogin, 'slide-left': isLogin }">
          <form v-if="isLogin" @submit.prevent="handleLogin">
            <h1>登 录</h1>
            <input v-model="phone" type="text" placeholder="手机号" />
            <input v-model="password" type="password" placeholder="密码" />
            <div class="remember">
              <input type="checkbox" id="remember" v-model="rememberMe" />记住密码
            </div>
            <a href="#">忘记密码？</a>
            <button type="submit">登 录</button>
          </form>
          <form v-else @submit.prevent="handleRegister">
            <h1>注册</h1>
            <input v-model="phone" type="text" placeholder="手机号" />
            <input v-model="password" type="password" placeholder="密码" />
            <input v-model="password2" type="password" placeholder="确认密码" />
            <button type="submit">注册</button>
          </form>
        </div>
        <div class="info" :class="{ 'slide-right': isLogin, 'slide-left': !isLogin }">
          <h1>{{ isLogin ? '你好朋友!' : '欢迎回来!' }}</h1>
          <p>{{ isLogin ? '输入您的个人信息，与我们一起开始旅程' : '使用本项目，需要进行登录' }}</p>
          <button class="ghost" @click="toggleForm">{{ isLogin ? '注册' : '登录' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

  const isLogin = ref(true);
  const phone = ref('');
  const password = ref('');
  const password2 = ref('');
  const rememberMe = ref(false);
  const router = useRouter();
  const toggleForm = () => {
    isLogin.value = !isLogin.value;
  };
  
  // 登录
  const handleLogin = async () => {
    router.push('/home');
  };
  // 注册
  const handleRegister = async() => {};

  </script>
  
  <style scoped>

.login-register {
    width: 100%;
    min-width: 800px;
    height: 95vh;
    display: flex;
    flex-direction: column;
    justify-content: center; 
    align-items: center; 
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

h1 {
  font-weight: bold;
  margin: 0;
}

p {
  font-size: 14px;
  font-weight: 100;
  line-height: 20px;
  letter-spacing: 0.5px;
  margin: 20px 0 30px;
}

a {
  color: #333;
  font-size: 14px;
  text-decoration: none;
  margin: 15px 0;
}

/* 按钮样式 */
button {
  border-radius: 20px;
  border: 1px solid #3498db;
  background-color: #3498db;
  color: #ffffff;
  font-size: 12px;
  font-weight: bold;
  padding: 12px 45px;
  letter-spacing: 1px;
  text-transform: uppercase;
  transition: transform 80ms ease-in;
}

button:active {
  transform: scale(0.95);
}

button:focus {
  outline: none;
}

button.ghost {
  background-color: transparent;
  border-color: #ffffff;
}

/* 表单样式 */
form {
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 0 50px;
  height: 100%;
  text-align: center;
}

/* 输入框样式 */
input {
  background-color: #eee;
  border: none;
  padding: 12px 15px;
  margin: 8px 0;
  width: 100%;
}

/* 复选框样式 */
.remember {
  display: flex;
  flex-direction: row;
  justify-content: flex-start;
  align-items: center;
  align-self: baseline;
}

.remember input {
  background-color: #eee;
  border: none;
  padding: 0;
  margin: 0;
  width: auto;
  margin-right: 8px;
}

.container {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25), 0 10px 10px rgba(0, 0, 0, 0.22);
  position: relative;
  overflow: hidden;
  width: 768px;
  max-width: 100%;
  min-height: 480px;
}


.form-container {
  display: flex;
  width: 100%;
  position: absolute;
  top: 0;
  height: 100%;
}

.form {
  width: 50%;
  padding: 20px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
  background: white;
}

.info {
  background: linear-gradient(to right, #3498db, #3449db);
  color: #ffffff;
  position: relative;
  left: -50%;
  height: 100%;
  width: 50%;
  padding: 20px;
  text-align: center;
  display: flex;
  /* 启用Flexbox */
  flex-direction: column;
  /* 子元素垂直排列 */
  justify-content: center;
  /* 垂直居中 */
  align-items: center;
  /* 水平居中 */
}

/* 动画 */
.slide-left {
  transition: transform 0.6s ease-in-out;
  transform: translateX(0%);
}

.slide-right {
  transition: transform 0.6s ease-in-out;
  transform: translateX(100%);
}
</style>
