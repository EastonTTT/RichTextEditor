import type {AxiosRequestConfig } from "axios";
type RequestKey = string

const pendingMap = new Map<RequestKey,AbortController>()

//给每个请求生成key标识
function generateKey(config: AxiosRequestConfig):RequestKey{
  const {url,method,params} = config
  return [url,method,JSON.stringify(params)].join('&')
}

//添加请求
export function addPendingRequest(config: AxiosRequestConfig){
  const key = generateKey(config)
  console.log(`request key got: ${key}.`)
  if(pendingMap.has(key)){
    const controller = pendingMap.get(key)
    controller?.abort()
  }
  const controller = new AbortController()
  config.signal = controller.signal
  pendingMap.set(key, controller)
  console.log('request added.')
}

//在请求完成之后从队列中移除
export function removePendingRequest(config: AxiosRequestConfig){
  const key = generateKey(config)
  console.log(`request key got: ${key}.`)
  if(pendingMap.has(key)){
    pendingMap.delete(key)
    console.log('request deleted.')
  }
}

//清楚所有请求，并清空队列
export function removeAllRequest(){
  for(const [, controller] of pendingMap){
    controller.abort()
  }
  pendingMap.clear()
}
