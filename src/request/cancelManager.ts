// 对并发 HTTP 请求去重，并支持请求取消。
import type { AxiosRequestConfig } from 'axios'

type RequestKey = string

// 用请求签名去重，避免短时间内重复点击触发多次等价请求。
const pendingMap = new Map<RequestKey, AbortController>()

function generateKey(config: AxiosRequestConfig): RequestKey {
  const { url, method, params, data } = config
  return [url, method, JSON.stringify(params), JSON.stringify(data)].join('&')
}

export function addPendingRequest(config: AxiosRequestConfig) {
  const key = generateKey(config)

  if (pendingMap.has(key)) {
    // 新请求到来时取消旧请求，让最新一次用户操作生效。
    pendingMap.get(key)?.abort()
  }

  const controller = new AbortController()
  const upstreamSignal = config.signal as AbortSignal | undefined

  if (upstreamSignal) {
    if (upstreamSignal.aborted) {
      controller.abort(upstreamSignal.reason)
    } else {
      upstreamSignal.addEventListener(
        'abort',
        () => {
          controller.abort(upstreamSignal.reason)
        },
        { once: true },
      )
    }
  }

  config.signal = controller.signal
  pendingMap.set(key, controller)
}

export function removePendingRequest(config: AxiosRequestConfig) {
  const key = generateKey(config)
  pendingMap.delete(key)
}

export function removeAllRequest() {
  // 在全局退出或页面销毁场景下，可以一次性取消所有挂起请求。
  for (const [, controller] of pendingMap) {
    controller.abort()
  }

  pendingMap.clear()
}
