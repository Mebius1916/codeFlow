'use client'

import { useEffect, useRef } from 'react'
import { useRuntimeStore } from '../../lib/store'
import { stripAnsi } from '../../lib/utils/ansi'

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
    <div className="h-full bg-[#18181b] border-t border-white/10 flex flex-col">
      <div className="flex items-center justify-between px-4 py-2 bg-[#18181b] border-b border-white/5">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">终端</h3>
        </div>
        <button
          onClick={clearTerminal}
          className="text-gray-500 hover:text-gray-300 transition-colors p-1 rounded-md hover:bg-white/5"
          title="清空终端"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
      
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed bg-[#0f0f11] custom-scrollbar"
      >
        {terminalOutput.length === 0 ? (
          <div className="text-gray-600 italic">等待执行代码...</div>
        ) : (
          terminalOutput.map((output) => (
            <div
              key={output.id}
              className={`
                break-words whitespace-pre-wrap
                ${output.type === 'stderr' ? 'text-red-400 bg-red-900/10 -mx-4 px-4 py-1' : ''}
                ${output.type === 'stdout' ? 'text-gray-300' : ''}
                ${output.type === 'system' ? 'text-blue-400 font-bold mt-2 mb-1' : ''}
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

