import { useEffect, forwardRef, useImperativeHandle } from 'react'
import { Editor } from './Editor'
import { TerminalPanel } from './features/TerminalPanel'
import { FileTreePanel } from './features/FileTreePanel'
import { Toolbar } from './features/Toolbar'
import { useEditorStore } from '../lib/store'
import type { CodeEditorProps, CodeEditorRef } from './types/types'
import { FeatureProvider } from '../lib/context/FeatureContext'

export const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(({
  roomId,
  user,
  initialFiles = {},
  height = '100vh',
  wsUrl,
  features = { terminal: false, fileTree: true },
}, ref) => {
  const { addFile, openFile, closeFile } = useEditorStore()
  
  // 暴露 API 给外部
  useImperativeHandle(ref, () => ({
    openFile,
    closeFile,
    addFile: (path: string, content?: string) => addFile(path, content || ''),
    getFiles: () => useEditorStore.getState().files,
    getActiveFile: () => useEditorStore.getState().activeFile,
    getOpenFiles: () => useEditorStore.getState().openFiles,
  }))
  
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
    <FeatureProvider features={features}>
      <div 
        className="flex flex-col bg-[#1e1e1e] overflow-hidden"
        style={{ height }}
      >
        <Toolbar />
        
        <div className="flex flex-1 overflow-hidden relative">
          <FileTreePanel />
          
          <div className="flex flex-1 flex-col overflow-hidden relative">
            <div className="flex-1 overflow-hidden relative">
              <Editor 
                roomId={roomId} 
                user={user} 
                wsUrl={wsUrl}
              />
            </div>
            
            <TerminalPanel />
          </div>
        </div>
      </div>
    </FeatureProvider>
  )
})

CodeEditor.displayName = 'CodeEditor'

export type { CodeEditorProps, CodeEditorRef }

