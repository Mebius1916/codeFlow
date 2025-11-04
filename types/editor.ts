import type * as monaco from 'monaco-editor'

export interface MonacoEditorOptions extends monaco.editor.IStandaloneEditorConstructionOptions {
  // 扩展配置项
}

export interface CursorPosition {
  lineNumber: number
  column: number
}

export interface Selection {
  startLineNumber: number
  startColumn: number
  endLineNumber: number
  endColumn: number
}

