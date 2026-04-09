// 基于共享 HTTP 客户端暴露带类型的请求辅助方法。
import httpClient, { request } from './httpClient'
import { setInterceptor } from './interceptor'
import { requestWithRetry } from './withRetry'
import type { AxiosRequestConfig } from 'axios'
import type { Params, Data } from './types'

setInterceptor(httpClient)

export { request }

type RequestConfig = Omit<AxiosRequestConfig, 'url' | 'method' | 'params' | 'data'>

// 这里提供最薄的一层 HTTP 方法包装，保持调用处写法统一。
export function get<T = unknown>(url: string, params?: Params, config: RequestConfig = {}) {
  return request<T>({ url, method: 'get', params, ...config })
}

export function post<T = unknown>(url: string, data?: Data, config: RequestConfig = {}) {
  return request<T>({ url, method: 'post', data, ...config })
}

export function patch<T = unknown>(url: string, data?: Data, config: RequestConfig = {}) {
  return request<T>({ url, method: 'patch', data, ...config })
}

export function del<T = unknown>(url: string, config: RequestConfig = {}) {
  return request<T>({ url, method: 'delete', ...config })
}

export function getWithRetry<T = unknown>(url: string, params?: Params, config: RequestConfig = {}) {
  return requestWithRetry<T>({ url, method: 'get', params, ...config })
}

export function postWithRetry<T = unknown>(url: string, data?: Data, config: RequestConfig = {}) {
  return requestWithRetry<T>({ url, method: 'post', data, ...config })
}
