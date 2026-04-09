// 为可重试的请求流程增加简单的重试能力。
import type { AxiosRequestConfig } from 'axios'
import { request } from './httpClient'

export interface RetryOptions {
  timeout?: number
  maxRetries?: number
  retryDelay?: number
  signal?: AbortSignal
}

export async function requestWithRetry<T = unknown>(config: AxiosRequestConfig, options: RetryOptions = {}) {
  const { timeout = 15000, maxRetries = 3, retryDelay = 1000, signal } = options

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const controller = new AbortController()
    const timeoutSignal = AbortSignal.timeout(timeout)
    const combinedSignal = signal
      ? AbortSignal.any([signal, timeoutSignal, controller.signal])
      : AbortSignal.any([timeoutSignal, controller.signal])

    try {
      return await request<T>({ ...config, signal: combinedSignal })
    } catch (error) {
      if (combinedSignal.aborted) {
        console.warn('Request aborted.')
        throw error
      }

      if (attempt < maxRetries - 1) {
        console.warn(`Request failed. Retrying attempt ${attempt + 2} of ${maxRetries}.`)
        await new Promise((resolve) => window.setTimeout(resolve, retryDelay))
        continue
      }

      controller.abort('Maximum retry attempts reached.')
      throw error
    }
  }

  throw new Error('Request retry loop exited unexpectedly.')
}
