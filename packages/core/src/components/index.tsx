import { useEffect, forwardRef, useImperativeHandle } from 'react'
import { Editor } from './Editor'
import { TerminalPanel } from './features/Terminal/TerminalPanel'
import { FileTreeHeader, FileTreePanel } from './features/file-tree'
import { Toolbar } from './features/Toolbar'
import { useEditorStore, useUiStore } from '../lib/store'
import type { CodeEditorProps, CodeEditorRef } from './types/types'
import { FeatureProvider } from '../lib/context/FeatureContext'
import { useFileTreeActions } from './features/file-tree/useFileTreeActions'

export const CodeEditor = forwardRef<CodeEditorRef, CodeEditorProps>(({
  roomId,
  user,
  initialFiles = {},
  height = '100vh',
  wsUrl,
  features = { terminal: false, fileTree: true, toolbar: true },
  onStateChange,
  fileTreeActions: externalFileTreeActions, // 允许外部传入 actions
}, ref) => {
  const { addFile, openFile, closeFile, deleteFile, renameFile, files, activeFile, openFiles } = useEditorStore()
  const { fileTreeWidth } = useUiStore()
  const internalFileTreeActions = useFileTreeActions()
  const fileTreeActions = externalFileTreeActions || internalFileTreeActions
  
  // 监听状态变化并通知外部
  useEffect(() => {
    onStateChange?.({
      files,
      activeFile,
      openFiles
    })
  }, [files, activeFile, openFiles, onStateChange])

  // 暴露 API 给外部
  useImperativeHandle(ref, () => ({
    openFile,
    closeFile,
    addFile: (path: string, content?: string) => addFile(path, content || ''),
    deleteFile,
    renameFile,
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
        {features.toolbar !== false && (
          <div className="flex w-full overflow-hidden border-b border-[#2a2f4c]">
            {features.fileTree !== false && features.fileTreeHeader !== false && (
              <FileTreeHeader
                width={fileTreeWidth}
                withRightBorder
                onNewFile={() => fileTreeActions.handleStartCreate(null, 'file')}
                onNewFolder={() => fileTreeActions.handleStartCreate(null, 'folder')}
              />
            )}
            <div className="flex-1 min-w-0">
              <Toolbar />
            </div>
          </div>
        )}
        
        <div className="flex flex-1 overflow-hidden relative">
          {/* File Tree Panel */}
      <div 
        className="h-full border-r border-[#2a2f4c] flex flex-col"
        style={{ width: fileTreeWidth, backgroundColor: 'rgb(15, 17, 25)' }}
      >
        <FileTreePanel
          actions={fileTreeActions}
          showHeader={features.toolbar === false && features.fileTreeHeader !== false}
        />
      </div>
      
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
