export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6

export type HeadingItem = {
  level: number
  text: string
  id: string
  pos: number
  children?: HeadingItem[]
}
