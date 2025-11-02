import httpClient, { request } from "./httpClient";
import { setInterceptor } from "./interceptor";
import type { Params, Data } from "./types";
setInterceptor(httpClient)

export { request }

export function get(url: string, params?:Params, config:any = {}){
  return request({url: url,method:'get', params,...config })
}

export function post(url: string, data?:Data, config:any = {}){
  return request({url:url,data,...config})
}
