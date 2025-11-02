export interface requestResponse<T = any> {
  code: number,
  msg: string,
  data: T
}

export type Params = Record<string, any> | undefined

export type Data = Record<string, any> | FormData | undefined
