'use client'

import { useCollaborationStore, useRuntimeStore } from '../../lib/store'
import { executeCode } from '../../lib/webcontainer/execute'

export function Toolbar() {
  const { connectionStatus, users } = useCollaborationStore()
  const { currentProcess } = useRuntimeStore()

  const isExecuting = currentProcess?.status === 'running'

  const handleRun = async () => {
    if (isExecuting) return
    await executeCode()
  }

  const statusColor = {
    connected: 'bg-green-500',
    connecting: 'bg-yellow-500',
    disconnected: 'bg-red-500',
  }[connectionStatus]

  return (
    <div className="h-12 bg-[#2d2d30] border-b border-gray-700 flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <button
          onClick={handleRun}
          disabled={isExecuting}
          className={`
            px-4 py-1.5 rounded text-sm font-medium transition-colors
            ${isExecuting 
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-700 text-white'
            }
          `}
        >
          {isExecuting ? '▶️ 运行中...' : '▶️ 运行'}
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span>👥 在线: {users.length}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <div className={`w-2 h-2 rounded-full ${statusColor}`} />
          <span>
            {connectionStatus === 'connected' && '已连接'}
            {connectionStatus === 'connecting' && '连接中'}
            {connectionStatus === 'disconnected' && '未连接'}
          </span>
        </div>
      </div>
    </div>
  )
}

