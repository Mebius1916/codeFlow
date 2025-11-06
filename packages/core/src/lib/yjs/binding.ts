import * as Y from 'yjs'
import type { WebsocketProvider } from 'y-websocket'
import type * as Monaco from 'monaco-editor'

/**
 * 创建 Monaco 和 Yjs 的绑定
 * @param yText - Yjs 文本对象
 * @param editor - Monaco 编辑器实例
 * @param provider - WebSocket Provider
 * 
 * 注意：仅在客户端调用，y-monaco 依赖浏览器环境
 */
export async function createMonacoBinding(
  yText: Y.Text,
  editor: Monaco.editor.IStandaloneCodeEditor,
  provider: WebsocketProvider
) {
  // 动态导入 y-monaco（仅客户端）
  const { MonacoBinding } = await import('y-monaco')
  
  return new MonacoBinding(
    yText,
    editor.getModel()!,
    new Set([editor]),
    provider.awareness
  )
}

/**
 * 同步光标位置到 Awareness
 */
export function syncCursorToAwareness(
  editor: Monaco.editor.IStandaloneCodeEditor,
  provider: WebsocketProvider
) {
  editor.onDidChangeCursorPosition((e) => {
    provider.awareness.setLocalStateField('cursor', {
      line: e.position.lineNumber,
      column: e.position.column,
    })
  })

  editor.onDidChangeCursorSelection((e) => {
    const selection = e.selection
    provider.awareness.setLocalStateField('selection', {
      startLine: selection.startLineNumber,
      startColumn: selection.startColumn,
      endLine: selection.endLineNumber,
      endColumn: selection.endColumn,
    })
  })
}

