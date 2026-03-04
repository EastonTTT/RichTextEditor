import httpClient, { request } from './httpClient'
import { setInterceptor } from './interceptor'
import { requestWithRetry } from './withRetry'
import type { AxiosRequestConfig } from 'axios'
import type { Params, Data } from './types'

setInterceptor(httpClient)

export { request }

type RequestConfig = Omit<AxiosRequestConfig, 'url' | 'method' | 'params' | 'data'>

export function get(url: string, params?: Params, config: RequestConfig = {}) {
  return request({ url, method: 'get', params, ...config })
}

export function post(url: string, data?: Data, config: RequestConfig = {}) {
  return request({ url, method: 'post', data, ...config })
}

export function getWithRetry(url: string, params?: Params, config: RequestConfig = {}) {
  return requestWithRetry({ url, method: 'get', params, ...config })
}

export function postWithRetry(url: string, data?: Data, config: RequestConfig = {}) {
  return requestWithRetry({ url, method: 'post', data, ...config })
}
