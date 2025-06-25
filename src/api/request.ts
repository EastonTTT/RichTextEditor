import axios from 'axios'
import { ElMessage } from 'element-plus'

// 创建axios实例
const request = axios.create({
<<<<<<< HEAD
  baseURL: 'http://172.30.211.5:8080', // 设置基础URL
  timeout: 500, // 请求超时时间
})
=======
    baseURL: 'http://192.168.33.1:8080',
    timeout: 5000 // 请求超时时间
});
>>>>>>> 11908b31ca7dfdb1e84a0c573cf89069bda66439

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等认证信息
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    ElMessage.error(error.message || '请求失败')
    return Promise.reject(error)
  }
)

<<<<<<< HEAD
export default request
=======
export default request;
>>>>>>> 11908b31ca7dfdb1e84a0c573cf89069bda66439
