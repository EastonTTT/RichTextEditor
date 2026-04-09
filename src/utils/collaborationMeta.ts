// 规范化协同编辑器共享的 Yjs 元数据值。
import type * as Y from 'yjs'

// 协同元信息只保存轻量状态，尽量保持序列化后结构稳定。
export function normalizeVisibility(value: unknown): 'private' | 'shared' {
  return value === 'shared' ? 'shared' : 'private'
}

export function readStringArray(value: unknown): string[] {
  // Y.Map 中拿到的值类型并不绝对可靠，这里统一收敛成干净的字符串数组。
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
  // 写入前先比较，避免无意义同步再次触发 observe 回调。
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
