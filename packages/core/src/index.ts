/**
 * 协同代码编辑器组件 - 导出入口
 */

/// <reference types="./types/images" />
// 初始化 Monaco Editor 环境
import './lib/monaco/setup'

export { CodeEditor } from './components'
export { FileTreeHeader } from './components/features/file-tree/FileTreeHeader'
export { useFileTreeActions } from './components/features/file-tree/useFileTreeActions'
export { FileIcon } from './components/features/file-tree/FileIcon'
export type { CodeEditorProps, CodeEditorRef } from './components/types/types'

