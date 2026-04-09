// 创建前端数据层复用的 Axios 客户端。
import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'
import type { requestResponse } from './types'

const baseURL = import.meta.env.VITE_DEV_API_BASE_URL

const httpClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
})

export async function request<T = unknown>(config: AxiosRequestConfig) {
  const response = await httpClient.request<requestResponse<T>>(config)
  return response.data.data
}

export default httpClient
