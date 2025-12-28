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
    <div className="h-14 bg-[#18181b] border-b border-white/10 flex items-center justify-between px-4 shadow-sm z-10">
      <div className="flex items-center gap-4">
        {/* 文件名标签 (模拟 IDE 标签页) */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#1e1e1e] rounded-t-md border-t border-x border-white/10 text-gray-300 text-sm translate-y-[9px]">
          <span className="text-blue-400">JS</span>
          <span>main.js</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={handleRun}
          disabled={isExecuting}
          className={`
            flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all
            ${isExecuting 
              ? 'bg-gray-700/50 text-gray-400 cursor-not-allowed' 
              : 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 hover:shadow-green-900/40 active:scale-95'
            }
          `}
        >
          {isExecuting ? (
            <>
              <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>运行中...</span>
            </>
          ) : (
            <>
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              <span>运行代码</span>
            </>
          )}
        </button>

        <div className="h-4 w-px bg-white/10" />

        <div className="flex items-center gap-3 text-xs font-medium">
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/5 text-gray-400 border border-white/5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>{users.length}</span>
          </div>
          
          <div className={`
            flex items-center gap-1.5 px-2 py-1 rounded-full border
            ${connectionStatus === 'connected' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 
              connectionStatus === 'connecting' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' : 
              'bg-red-500/10 text-red-400 border-red-500/20'}
          `}>
            <div className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
            <span>
              {connectionStatus === 'connected' && '已连接'}
              {connectionStatus === 'connecting' && '连接中'}
              {connectionStatus === 'disconnected' && '未连接'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

