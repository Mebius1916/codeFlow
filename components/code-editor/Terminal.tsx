'use client'

import { useEffect, useRef } from 'react'
import { useRuntimeStore } from '@/lib/store'
import { stripAnsi } from '@/lib/utils/ansi'

export function Terminal() {
  const { terminalOutput, clearTerminal } = useRuntimeStore()
  const terminalRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [terminalOutput])

  return (
    <div className="h-full bg-[#1e1e1e] border-t border-gray-700 flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700">
        <h3 className="text-sm font-medium text-gray-300">终端</h3>
        <button
          onClick={clearTerminal}
          className="text-xs px-2 py-1 rounded hover:bg-gray-700 text-gray-400"
        >
          清空
        </button>
      </div>
      
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-sm"
      >
        {terminalOutput.length === 0 ? (
          <div className="text-gray-500">等待执行代码...</div>
        ) : (
          terminalOutput.map((output) => (
            <div
              key={output.id}
              className={`
                mb-1
                ${output.type === 'stderr' ? 'text-red-400' : ''}
                ${output.type === 'stdout' ? 'text-gray-300' : ''}
                ${output.type === 'system' ? 'text-blue-400' : ''}
              `}
            >
              {stripAnsi(output.content)}
            </div>
          ))
        )}
      </div>
    </div>
  )
}

