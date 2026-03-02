import { request } from './httpClient'

interface RetryOptions {
  timeout?: number
  maxRetries?: number
  retryDelay?: number
  signal?: AbortSignal
}

export async function requestWithRetry(config: Record<string, unknown>, options: RetryOptions = {}) {
  const { timeout = 15000, maxRetries = 3, retryDelay = 1000, signal } = options

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const controller = new AbortController()
    const timeoutSignal = AbortSignal.timeout(timeout)
    const combinedSignal = signal
      ? AbortSignal.any([signal, timeoutSignal, controller.signal])
      : AbortSignal.any([timeoutSignal, controller.signal])

    try {
      const res = await request({ ...config, signal: combinedSignal })
      return res
    } catch (err) {
      if (combinedSignal.aborted) {
        console.log('请求被终止')
        throw err
      }
      if (attempt < maxRetries) {
        console.log(`第${attempt + 1}次请求失败，正在重试...`)
        await new Promise((resolve) => window.setTimeout(resolve, retryDelay))
        continue
      }
      controller.abort('已到达最大重试次数，请求失败..')
      throw err
    }
  }
  throw new Error('unknown unreached err.')
}
