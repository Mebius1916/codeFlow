'use client'

import { useEffect } from 'react'
import { Editor } from './Editor'
import { Terminal } from './Terminal'
import { Toolbar } from './Toolbar'
import { useEditorStore, useUiStore } from '@/lib/store'
import type { CodeEditorProps } from './types'

export function CodeEditor({
  roomId,
  initialFiles = {},
  readOnly = false,
  theme = 'dark',
  height = '100vh',
  onSave,
  onError,
  user,
}: CodeEditorProps) {
  const { addFile, openFile } = useEditorStore()
  const { isTerminalVisible, terminalHeight } = useUiStore()

  // 初始化文件
  useEffect(() => {
    Object.entries(initialFiles).forEach(([path, content]) => {
      addFile(path, content)
    })
    
    // 自动打开第一个文件
    const firstFile = Object.keys(initialFiles)[0]
    if (firstFile) {
      openFile(firstFile)
    }
  }, []) // 只在挂载时执行一次

  return (
    <div 
      className="flex flex-col bg-[#1e1e1e]"
      style={{ height }}
    >
      <Toolbar />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <Editor roomId={roomId} user={user} />
        </div>
        
        {isTerminalVisible && (
          <div style={{ height: terminalHeight }}>
            <Terminal />
          </div>
        )}
      </div>
    </div>
  )
}

export type { CodeEditorProps }

