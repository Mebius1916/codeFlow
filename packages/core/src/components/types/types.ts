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

  // ===== 功能配置 =====
  features?: {
    terminal?: boolean  // 是否启用终端，默认 false
    fileTree?: boolean  // 是否启用文件树，默认 true
  }
}

/**
 * CodeEditor 暴露给外部的 Ref 接口
 */
export interface CodeEditorRef {
  /** 打开文件 */
  openFile: (path: string) => void
  /** 关闭文件 */
  closeFile: (path: string) => void
  /** 创建/更新文件 */
  addFile: (path: string, content?: string) => void
  /** 获取当前所有文件内容 */
  getFiles: () => Record<string, string>
  /** 获取当前激活的文件路径 */
  getActiveFile: () => string | null
  /** 获取当前打开的文件列表 */
  getOpenFiles: () => string[]
}

