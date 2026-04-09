// 定义格式化组件使用的编辑器扩展元数据类型。
export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export type HeadingItem = {
  level: number
  text: string
  id: string
  pos: number
  children?: HeadingItem[]
}
