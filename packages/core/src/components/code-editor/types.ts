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
}

