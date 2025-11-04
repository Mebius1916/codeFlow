export interface User {
  id: string
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

