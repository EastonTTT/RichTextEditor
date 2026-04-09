// 注入鉴权请求头，并统一处理接口错误。
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { requestResponse } from './types'
import { addPendingRequest, removePendingRequest } from './cancelManager'

export function setInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // 登录态由本地 token 驱动，请求发出前统一补上鉴权头。
      const token = localStorage.getItem('token')

      if (token) {
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
      }

      addPendingRequest(config)
      return config
    },
    (error) => Promise.reject(error),
  )

  instance.interceptors.response.use(
    (response: AxiosResponse<requestResponse>) => {
      // 无论成功或失败，都要把请求从 pending 队列里移除，避免重复取消。
      removePendingRequest(response.config)
      const res = response.data

      if (res.code !== 200) {
        console.warn(`Request failed: ${res.msg}`)
        return Promise.reject(res)
      }

      return response
    },
    (error) => {
      if (error?.config) {
        removePendingRequest(error.config)
      }

      return Promise.reject(error)
    },
  )
}
