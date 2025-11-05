import * as Y from 'yjs'
import type { WebsocketProvider } from 'y-websocket'

export interface ProviderConfig {
  roomId: string
  wsUrl?: string
  userId: string // 必须由外部传入
  userName?: string
  userColor?: string
}

/**
 * 生成随机颜色
 */
function generateRandomColor(): string {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
}

/**
 * 创建 Yjs WebSocket Provider
 * 简化版：仅处理基本连接和文档同步
 * 
 * 注意：仅在客户端调用，y-websocket 依赖浏览器环境
 */
export async function createYjsProvider(config: ProviderConfig): Promise<{
  yDoc: Y.Doc
  provider: WebsocketProvider
}> {
  const { roomId, wsUrl, userId, userName = 'Anonymous', userColor } = config

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
    id: userId, // 使用外部传入的稳定用户ID
    name: userName,
    color: userColor || generateRandomColor(),
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

