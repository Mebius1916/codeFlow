import { useCollaborationStore, useRuntimeStore, useEditorStore } from '../../lib/store'
import { executeCode } from '../../lib/webcontainer/execute'

export function Toolbar() {
  const { connectionStatus, users } = useCollaborationStore()
  const { currentProcess } = useRuntimeStore()
  const { activeFile, openFiles, openFile, closeFile } = useEditorStore()

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
    <div className="h-14 bg-[#18181b] border-b border-white/10 flex items-center justify-between px-4 shadow-sm z-10 overflow-hidden">
      <div 
        className="flex items-center gap-1 overflow-x-auto overflow-y-hidden mask-linear-fade flex-1 mr-4 h-full pt-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          .mask-linear-fade::-webkit-scrollbar {
            display: none;
          }
        `}</style>
        {openFiles.map((file) => (
          <div
            key={file}
            onClick={() => openFile(file)}
            className={`
              group flex items-center gap-2 px-3 py-1.5 rounded-t-md border-t border-x cursor-pointer text-sm transition-colors min-w-[100px] max-w-[200px] flex-shrink-0 h-full mt-auto
              ${activeFile === file 
                ? 'bg-[#1e1e1e] border-white/10 text-gray-300' 
                : 'bg-transparent border-transparent text-gray-500 hover:bg-[#1e1e1e]/50 hover:text-gray-400'
              }
            `}
          >
            <span className={activeFile === file ? 'text-blue-400' : ''}>
              {file.endsWith('js') ? 'JS' : file.endsWith('css') ? '#' : '📄'}
            </span>
            <span className="truncate flex-1">{file}</span>
            <button
              onClick={(e) => {
                e.stopPropagation()
                closeFile(file)
              }}
              className={`
                p-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity
                ${activeFile === file ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-white/10 text-gray-500 hover:text-gray-300'}
              `}
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
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

