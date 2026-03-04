export interface requestResponse<T = unknown> {
  code: number
  msg: string
  data: T
}

export type Params = Record<string, unknown> | undefined

export type Data = Record<string, unknown> | FormData | undefined
