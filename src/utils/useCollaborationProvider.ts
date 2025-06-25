import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'

interface CollaborationOptions {
  wsUrl: string
  roomName: string
  doc: Y.Doc
  user?: {
    name: string
    color: string
  }
  autoConnect?: boolean
}

export function useCollaborationProvider(options: CollaborationOptions) {
  const { wsUrl, roomName, doc, user, autoConnect = false } = options
  const provider = new WebsocketProvider(wsUrl, roomName, doc, { connect: autoConnect })
  const awareness = provider.awareness

  if (user) {
    awareness.setLocalStateField('user', user)
  }

  //提供操作函数
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
