import httpClient, { request } from './httpClient'
import { setInterceptor } from './interceptor'
import { requestWithRetry } from './withRetry'
import type { Params, Data } from './types'
setInterceptor(httpClient)

export { request }

export function get(url: string, params?: Params, config: any = {}) {
  return request({ url, method: 'get', params, ...config })
}

export function post(url: string, data?: Data, config: any = {}) {
  return request({ url, method: 'post', data, ...config })
}

export function getWithRetry(url: string, params: Params, config: any = {}) {
  return requestWithRetry({ url, method: 'get', params, ...config })
}

export function postWithRetry(url: string, data?: Data, config: any = {}) {
  return requestWithRetry({ url, method: 'post', data, ...config })
}
