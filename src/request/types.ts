// 后端接口统一返回 code/msg/data 三段式结构。
export interface requestResponse<T = unknown> {
  code: number
  msg: string
  data: T
}

export type Params = Record<string, unknown> | undefined

// data 同时兼容普通 JSON 和文件上传的 FormData。
export type Data = object | FormData | undefined
