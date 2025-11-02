import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import type { requestResponse } from "./types";

/*
 * 设置请求拦截器函数，自动注入token，或设置自定义header
 */
export function setInterceptor(instance: AxiosInstance){
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = localStorage.getItem('token')
      if(token){
        config.headers = config.headers || {}
        config.headers.Authorization = `Bearer ${token}`
      }

      /* 这里还可以对header做其他补充 e.g. config.header.xxx = '' */
      return config
    },
    (error) => {
      return Promise.reject(error)
    }
  )

  instance.interceptors.response.use(
    (response: AxiosResponse<requestResponse>) => {
      const res = response.data
      if(res.code !== 200) {
        console.log('warning -- request err ' + res.msg)
        return Promise.reject(res)
      }
      return res.data
    },
    (error) => {
      return Promise.reject(error)
    }
  )
}
