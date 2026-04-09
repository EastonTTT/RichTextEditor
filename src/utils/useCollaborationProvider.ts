// 封装共享文档会话使用的 y-websocket provider。
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

interface CollaborationOptions {
  wsUrl: string
  roomName: string
  doc: Y.Doc
  token?: string
  user?: {
    name: string
    color: string
  }
  autoConnect?: boolean
}

export function useCollaborationProvider(options: CollaborationOptions) {
  // 对 y-websocket 做一层轻包装，业务层只关心连接、断开和 awareness。
  const { wsUrl, roomName, doc, token, user, autoConnect = false } = options
  const provider = new WebsocketProvider(wsUrl, roomName, doc, {
    connect: autoConnect,
    params: token ? { token } : undefined,
  })
  const awareness = provider.awareness

  if (user) {
    awareness.setLocalStateField('user', user)
  }

  // 暴露稳定的控制方法，避免外层直接触碰 provider 细节。
  const connect = () => provider.connect()
  const disconnect = () => provider.disconnect()
  const destroy = () => provider.destroy()

  return {
    provider,
    awareness,
    connect,
    disconnect,
    destroy,
    user,
  }
}
