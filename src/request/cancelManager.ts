import type { AxiosRequestConfig } from 'axios'

type RequestKey = string

const pendingMap = new Map<RequestKey, AbortController>()

function generateKey(config: AxiosRequestConfig): RequestKey {
  const { url, method, params, data } = config
  return [url, method, JSON.stringify(params), JSON.stringify(data)].join('&')
}

export function addPendingRequest(config: AxiosRequestConfig) {
  const key = generateKey(config)

  if (pendingMap.has(key)) {
    pendingMap.get(key)?.abort()
  }

  const controller = new AbortController()
  config.signal = controller.signal
  pendingMap.set(key, controller)
}

export function removePendingRequest(config: AxiosRequestConfig) {
  const key = generateKey(config)
  pendingMap.delete(key)
}

export function removeAllRequest() {
  for (const [, controller] of pendingMap) {
    controller.abort()
  }

  pendingMap.clear()
}
