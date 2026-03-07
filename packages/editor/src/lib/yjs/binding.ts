import * as Y from 'yjs'
import type * as Monaco from 'monaco-editor'
import { CursorManager } from './cursor'

interface AwarenessProvider {
  awareness: any 
}

export async function createMonacoBinding(
  yText: Y.Text,
  editor: Monaco.editor.IStandaloneCodeEditor,
  provider: AwarenessProvider,
) {
  const { MonacoBinding } = await import('y-monaco')

  const binding = new MonacoBinding(
    yText,
    editor.getModel()!,
    new Set([editor]),
    provider.awareness,
  )

  const cursorManager = new CursorManager(editor, provider.awareness)

  const originalDestroy = binding.destroy.bind(binding)
  binding.destroy = () => {
    cursorManager.destroy()
    originalDestroy()
  }

  return binding
}

export function syncCursorToAwareness(
  editor: Monaco.editor.IStandaloneCodeEditor,
  provider: AwarenessProvider,
) {
  editor.onDidChangeCursorPosition((e: Monaco.editor.ICursorPositionChangedEvent) => {
    provider.awareness.setLocalStateField('cursor', {
      line: e.position.lineNumber,
      column: e.position.column,
    })
  })

  editor.onDidChangeCursorSelection((e: Monaco.editor.ICursorSelectionChangedEvent) => {
    const selection = e.selection
    provider.awareness.setLocalStateField('selection', {
      startLine: selection.startLineNumber,
      startColumn: selection.startColumn,
      endLine: selection.endLineNumber,
      endColumn: selection.endColumn,
    })
  })
}
