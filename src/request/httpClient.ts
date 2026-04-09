// 创建前端数据层复用的 Axios 客户端。
import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import type { requestResponse } from './types'

// 开发环境的 API 地址由 Vite 环境变量控制，方便前后端独立切换。
const baseURL = import.meta.env.VITE_DEV_API_BASE_URL

const httpClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
})

export async function request<T = unknown>(config: AxiosRequestConfig) {
  // 统一在这里拆开后端的响应包裹，业务层直接拿 data 即可。
  const response = await httpClient.request<requestResponse<T>>(config)
  return response.data.data
}

export default httpClient
