import { useRef } from 'react'
import MonacoEditor from '@monaco-editor/react'
import type * as Monaco from 'monaco-editor'
import { getLanguageFromPath } from '../../lib/utils/file'

interface MonacoEditorWrapperProps {
  activeFile: string
  onMount: (editor: Monaco.editor.IStandaloneCodeEditor) => void
}

type MonacoNamespace = typeof import('monaco-editor')

export function MonacoEditorWrapper({ activeFile, onMount }: MonacoEditorWrapperProps) {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const language = getLanguageFromPath(activeFile)

  return (
    <MonacoEditor
      height="100%"
      defaultLanguage="javascript"
      language={language}
      theme="custom-dark"
      beforeMount={(monaco: MonacoNamespace) => {
        monaco.editor.defineTheme('custom-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: {
            'editor.background': '#15172A',
            'editor.lineHighlightBackground': '#2a2f4c',
          },
        })
      }}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
        fontLigatures: true,
        scrollBeyondLastLine: false,
        padding: { top: 16, bottom: 16 },
        cursorBlinking: 'smooth',
        cursorSmoothCaretAnimation: 'on',
        smoothScrolling: true,
        formatOnPaste: true,
        formatOnType: true,
      }}
      onMount={(editor: Monaco.editor.IStandaloneCodeEditor) => {
        editorRef.current = editor
        onMount(editor)
      }}
    />
  )
}
