export interface User {
  id: string      // clientID (唯一)，用作 React key
  userId?: string // 真实的用户ID（多个标签页可能相同）
  name: string
  color: string
  cursor?: {
    line: number
    column: number
  }
  selection?: {
    startLine: number
    startColumn: number
    endLine: number
    endColumn: number
  }
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected'

export interface AwarenessState {
  user: User
  lastUpdate: number
}

