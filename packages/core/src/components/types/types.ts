/**
 * CodeEditor 组件 Props
 * 
 * 参数边界说明：
 * - 外部传入：roomId, user, initialFiles, wsUrl, callbacks
 * - 内部管理：activeFile, files, users, connectionStatus, output 等
 */
export interface CodeEditorProps {
  // ===== 必需参数（外部传入）=====
  roomId: string
  user: {
    id: string        // 必需！由宿主应用管理稳定的用户ID
    name?: string     // 可选，显示名称
    color?: string    // 可选，光标颜色（未提供则自动生成）
  }
  
  // ===== 可选参数（外部传入）=====
  initialFiles?: Record<string, string>  // 初始文件内容
  height?: string | number               // 编辑器高度，默认 '100vh'
  wsUrl?: string                         // WebSocket 服务器地址，默认 'ws://localhost:1234'
  
  // ===== 回调函数（外部传入）=====
  onSave?: (files: Record<string, string>) => void  // 保存回调
  onError?: (error: Error) => void                   // 错误回调
  onStateChange?: (state: {                         // 编辑器状态变更回调
    files: Record<string, string>
    activeFile: string | null
    openFiles: string[]
  }) => void

  // ===== 功能配置 =====
  features?: {
    terminal?: boolean  // 是否启用终端，默认 false
    fileTree?: boolean  // 是否启用文件树，默认 true
    fileTreeHeader?: boolean // 是否启用文件树头部，默认 true
    toolbar?: boolean   // 是否启用工具栏，默认 true
    autoSave?: boolean | number // 是否启用自动保存，true 为默认 1000ms，number 为自定义毫秒数，默认 false
  }

  fileTreeActions?: any // 允许外部传入 useFileTreeActions 的返回值
}

/**
 * CodeEditor 暴露给外部的 Ref 接口
 */
export interface CodeEditorRef {
  openFile: (path: string) => void
  closeFile: (path: string) => void
  addFile: (path: string, content?: string) => void
  deleteFile: (path: string) => void
  renameFile: (oldPath: string, newPath: string) => void
  getFiles: () => Record<string, string>
  getActiveFile: () => string | null
  getOpenFiles: () => string[]
}

