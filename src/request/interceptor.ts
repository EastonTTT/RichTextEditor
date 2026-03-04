import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import type { requestResponse } from './types'
import { addPendingRequest, removePendingRequest } from './cancelManager'

export function setInterceptor(instance: AxiosInstance) {
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
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
