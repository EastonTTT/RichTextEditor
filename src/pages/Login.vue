<template>
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

<style></style>
