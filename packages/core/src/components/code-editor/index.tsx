'use client'

import { useEffect } from 'react'
import { Editor } from './Editor'
import { Terminal } from './Terminal'
import { Toolbar } from './Toolbar'
import { useEditorStore, useUiStore } from '../../lib/store'
import type { CodeEditorProps } from './types'

export function CodeEditor({
  roomId,
  user,
  initialFiles = {},
  height = '100vh',
  wsUrl,
  onSave,
  onError,
}: CodeEditorProps) {
  const { addFile, openFile } = useEditorStore()
  const { isTerminalVisible, terminalHeight } = useUiStore()

  // 参数校验
  if (!user.id) {
    throw new Error('[CodeEditor] user.id 是必需参数，请由宿主应用传入稳定的用户ID')
  }

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
      className="flex flex-col bg-[#1e1e1e] overflow-hidden"
      style={{ height }}
    >
      <Toolbar />
      
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <Editor 
            roomId={roomId} 
            user={user} 
            wsUrl={wsUrl}
          />
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

