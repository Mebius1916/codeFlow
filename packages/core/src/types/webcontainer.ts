export interface TerminalOutput {
  id: string
  type: 'stdout' | 'stderr' | 'system'
  content: string
  timestamp: number
}

export interface ProcessInfo {
  id: string
  command: string
  args: string[]
  startTime: number
  endTime?: number
  exitCode?: number
  status: 'running' | 'completed' | 'failed'
}

