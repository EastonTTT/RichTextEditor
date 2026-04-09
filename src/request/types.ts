// 定义 HTTP 层共享的请求与响应类型。
export interface requestResponse<T = unknown> {
  code: number
  msg: string
  data: T
}

export type Params = Record<string, unknown> | undefined

export type Data = object | FormData | undefined
