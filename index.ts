/**
 * 协同代码编辑器组件 - 统一导出入口
 * 
 * 使用方式：
 * import { CodeEditor } from 'collaborative-code-editor'
 * 
 * 用户只需要关注传入的 props：
 * - roomId: 房间ID
 * - user: 用户信息（id, name, color）
 * - initialFiles: 初始文件
 * - onSave, onError: 回调函数
 */

// ============================================
// 基础导出（推荐）
// ============================================

export { CodeEditor } from './components/code-editor'
export type { CodeEditorProps } from './components/code-editor/types'

