import * as Y from 'yjs'
import type { WebsocketProvider } from 'y-websocket'

export interface ProviderConfig {
  roomId: string
  wsUrl?: string
  userName?: string
  userColor?: string
}

/**
 * 创建 Yjs WebSocket Provider
 * 简化版：仅处理基本连接和文档同步
 * 
 * 注意：仅在客户端调用，y-websocket 依赖浏览器环境
 */
export async function createYjsProvider(config: ProviderConfig) {
  const { roomId, wsUrl, userName = 'Anonymous', userColor = '#' + Math.floor(Math.random() * 16777215).toString(16) } = config

  // 动态导入 y-websocket（仅客户端）
  const { WebsocketProvider } = await import('y-websocket')

  // 创建 Yjs 文档
  const yDoc = new Y.Doc()

  // 获取 WebSocket URL（开发环境默认 localhost:1234）
  const url = wsUrl || `ws://localhost:1234`

  // 创建 WebSocket Provider
  const provider = new WebsocketProvider(url, roomId, yDoc, {
    connect: true,
  })

  // 设置用户信息到 Awareness
  provider.awareness.setLocalStateField('user', {
    name: userName,
    color: userColor,
  })

  return { yDoc, provider }
}

/**
 * 清理 Provider 资源
 */
export function destroyProvider(provider: WebsocketProvider) {
  provider.awareness.destroy()
  provider.destroy()
}

