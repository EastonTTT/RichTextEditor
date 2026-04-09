// 规范化协同编辑器共享的 Yjs 元数据值。
import type * as Y from 'yjs'

export function normalizeVisibility(value: unknown): 'private' | 'shared' {
  return value === 'shared' ? 'shared' : 'private'
}

export function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return []
  }

  return value
    .map((item) => `${item}`.trim())
    .filter(Boolean)
}

export function arraysEqual(left: string[], right: string[]) {
  if (left.length !== right.length) {
    return false
  }

  return left.every((value, index) => value === right[index])
}

export function setMetaValueIfChanged(map: Y.Map<unknown>, key: string, nextValue: unknown) {
  const currentValue = map.get(key)

  if (Array.isArray(nextValue)) {
    const normalizedCurrent = readStringArray(currentValue)
    const normalizedNext = readStringArray(nextValue)
    if (arraysEqual(normalizedCurrent, normalizedNext)) {
      return
    }

    map.set(key, normalizedNext)
    return
  }

  if (currentValue === nextValue) {
    return
  }

  map.set(key, nextValue)
}
