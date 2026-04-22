// 为历史版本预览抽屉构建块级差异数据。
import type { DocumentVersion } from '@/types/document'

export type DiffRowType = 'added' | 'removed' | 'changed'
export type BlockKind = 'heading' | 'paragraph' | 'list-item' | 'code' | 'quote' | 'table' | 'divider' | 'other'

interface BlockItem {
  kind: BlockKind
  text: string
}

// 历史版本预览不做精细文本 diff，而是先按块切分再做结构化比较。
export interface DiffRow {
  type: DiffRowType
  blockType: BlockKind
  text?: string
  currentText?: string
  versionText?: string
}

export interface DiffStats {
  added: number
  removed: number
  changed: number
}

export const blockKindLabels: Record<BlockKind, string> = {
  heading: '标题',
  paragraph: '段落',
  'list-item': '列表项',
  code: '代码块',
  quote: '引用',
  table: '表格',
  divider: '分隔线',
  other: '内容块',
}

export const diffTagMap: Record<DiffRowType, string> = {
  added: '新增',
  removed: '删除',
  changed: '变更',
}

const versionReasonMetaMap: Record<
  string,
  {
    label: string
    tone: 'neutral' | 'brand' | 'success' | 'warning' | 'danger'
    type: 'primary' | 'success' | 'warning' | 'danger' | 'info'
    display: 'version' | 'record'
  }
> = {
  manual_save: {
    label: '手动保存',
    tone: 'brand',
    type: 'primary',
    display: 'version',
  },
  autosave: {
    label: '自动保存',
    tone: 'success',
    type: 'success',
    display: 'version',
  },
  manual_snapshot: {
    label: '手动快照',
    tone: 'brand',
    type: 'primary',
    display: 'version',
  },
  manual_snapshot_prepare: {
    label: '快照准备',
    tone: 'neutral',
    type: 'info',
    display: 'version',
  },
  restore_backup: {
    label: '恢复前备份',
    tone: 'warning',
    type: 'warning',
    display: 'version',
  },
  restore: {
    label: '版本恢复',
    tone: 'warning',
    type: 'warning',
    display: 'record',
  },
  offline_reconnect: {
    label: '断线重连同步',
    tone: 'success',
    type: 'success',
    display: 'version',
  },
  offline_restore: {
    label: '本地覆盖恢复',
    tone: 'danger',
    type: 'danger',
    display: 'version',
  },
}

function normalizeBlockText(text: string) {
  return text.replace(/\s+/g, ' ').trim()
}

function parseBlocks(html: string) {
  // 把 HTML 近似映射成“标题 / 段落 / 列表 / 表格”等块，方便用户阅读差异。
  if (!html) {
    return [] as BlockItem[]
  }

  const parser = new DOMParser()
  const body = parser.parseFromString(html, 'text/html').body
  const blocks: BlockItem[] = []

  const pushBlock = (kind: BlockKind, text: string) => {
    const normalized = normalizeBlockText(text)
    if (!normalized && kind !== 'divider') {
      return
    }

    blocks.push({
      kind,
      text: normalized || '---',
    })
  }

  const visitElement = (element: Element) => {
    const tagName = element.tagName.toLowerCase()

    if (/^h[1-6]$/.test(tagName)) {
      pushBlock('heading', element.textContent || '')
      return
    }

    if (tagName === 'p') {
      pushBlock('paragraph', element.textContent || '')
      return
    }

    if (tagName === 'blockquote') {
      pushBlock('quote', element.textContent || '')
      return
    }

    if (tagName === 'pre') {
      pushBlock('code', element.textContent || '')
      return
    }

    if (tagName === 'hr') {
      pushBlock('divider', '---')
      return
    }

    if (tagName === 'table') {
      const rows = Array.from(element.querySelectorAll('tr'))
        .map((row) =>
          Array.from(row.querySelectorAll('th, td'))
            .map((cell) => normalizeBlockText(cell.textContent || ''))
            .filter(Boolean)
            .join(' | '),
        )
        .filter(Boolean)
      pushBlock('table', rows.join('\n'))
      return
    }

    if (tagName === 'ul' || tagName === 'ol') {
      Array.from(element.children)
        .filter((child) => child.tagName.toLowerCase() === 'li')
        .forEach((child, index) => {
          const prefix = tagName === 'ol' ? `${index + 1}. ` : '• '
          pushBlock('list-item', `${prefix}${child.textContent || ''}`)
        })
      return
    }

    const childElements = Array.from(element.children)
    if (childElements.length > 0) {
      childElements.forEach(visitElement)
      return
    }

    pushBlock('other', element.textContent || '')
  }

  Array.from(body.children).forEach(visitElement)
  return blocks
}

export function buildBlockDiff(currentHtml: string, versionHtml: string) {
  // 这里使用 LCS 思路比较块序列，足够支撑版本预览而且实现成本较低。
  const currentBlocks = parseBlocks(currentHtml)
  const versionBlocks = parseBlocks(versionHtml)
  const dp = Array.from({ length: currentBlocks.length + 1 }, () => Array(versionBlocks.length + 1).fill(0))

  for (let i = currentBlocks.length - 1; i >= 0; i -= 1) {
    for (let j = versionBlocks.length - 1; j >= 0; j -= 1) {
      const currentSignature = `${currentBlocks[i].kind}:${currentBlocks[i].text}`
      const versionSignature = `${versionBlocks[j].kind}:${versionBlocks[j].text}`
      dp[i][j] =
        currentSignature === versionSignature
          ? dp[i + 1][j + 1] + 1
          : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }

  const rawRows: DiffRow[] = []
  let i = 0
  let j = 0

  while (i < currentBlocks.length && j < versionBlocks.length) {
    const currentSignature = `${currentBlocks[i].kind}:${currentBlocks[i].text}`
    const versionSignature = `${versionBlocks[j].kind}:${versionBlocks[j].text}`

    if (currentSignature === versionSignature) {
      i += 1
      j += 1
      continue
    }

    if (dp[i + 1][j] >= dp[i][j + 1]) {
      rawRows.push({
        type: 'removed',
        blockType: currentBlocks[i].kind,
        text: currentBlocks[i].text,
      })
      i += 1
    } else {
      rawRows.push({
        type: 'added',
        blockType: versionBlocks[j].kind,
        text: versionBlocks[j].text,
      })
      j += 1
    }
  }

  while (i < currentBlocks.length) {
    rawRows.push({
      type: 'removed',
      blockType: currentBlocks[i].kind,
      text: currentBlocks[i].text,
    })
    i += 1
  }

  while (j < versionBlocks.length) {
    rawRows.push({
      type: 'added',
      blockType: versionBlocks[j].kind,
      text: versionBlocks[j].text,
    })
    j += 1
  }

  const mergedRows: DiffRow[] = []
  for (let index = 0; index < rawRows.length; index += 1) {
    const current = rawRows[index]
    const next = rawRows[index + 1]

    if (
      next &&
      current.blockType === next.blockType &&
      ((current.type === 'removed' && next.type === 'added') || (current.type === 'added' && next.type === 'removed'))
    ) {
      mergedRows.push({
        type: 'changed',
        blockType: current.blockType,
        currentText: current.type === 'removed' ? current.text : next.text,
        versionText: current.type === 'added' ? current.text : next.text,
      })
      index += 1
      continue
    }

    mergedRows.push(current)
  }

  return {
    rows: mergedRows.slice(0, 120),
    stats: {
      added: mergedRows.filter((row) => row.type === 'added').length,
      removed: mergedRows.filter((row) => row.type === 'removed').length,
      changed: mergedRows.filter((row) => row.type === 'changed').length,
    } satisfies DiffStats,
    truncated: mergedRows.length > 120,
  }
}

export function getVersionReasonMeta(reason: string) {
  return (
    versionReasonMetaMap[reason] || {
      label: reason || '系统版本',
      tone: 'neutral' as const,
      type: 'info' as const,
      display: 'version' as const,
    }
  )
}

export function isRestoreRecord(reason: string) {
  return getVersionReasonMeta(reason).display === 'record'
}

export function getVersionDisplayTime(version: Pick<DocumentVersion, 'createdAt' | 'lastRestoredAt'>) {
  return version.lastRestoredAt || version.createdAt
}

export function formatVersionTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return value
  }

  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, '0')}-${`${date.getDate()}`.padStart(2, '0')} ${`${date.getHours()}`.padStart(2, '0')}:${`${date.getMinutes()}`.padStart(2, '0')}`
}
