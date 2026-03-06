import { useRef } from 'react'
import MonacoEditor, { loader } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import { getLanguageFromPath } from '../../lib/utils/file'

// 配置 monaco-editor 使用本地包，避免从 CDN 加载
loader.config({ monaco })

interface MonacoEditorWrapperProps {
  activeFile: string
  onMount: (editor: monaco.editor.IStandaloneCodeEditor) => void
}

export function MonacoEditorWrapper({ activeFile, onMount }: MonacoEditorWrapperProps) {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const language = getLanguageFromPath(activeFile)

  return (
    <MonacoEditor
      height="100%"
      defaultLanguage="javascript"
      language={language}
      theme="custom-dark"
      beforeMount={(monaco) => {
        monaco.editor.defineTheme('custom-dark', {
          base: 'vs-dark',
          inherit: true,
          rules: [],
          colors: {
            'editor.background': '#15172A', // rgb(21, 23, 42)
            'editor.lineHighlightBackground': '#2a2f4c', // rgb(42, 47, 76)
          }
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
      onMount={(editor) => {
        editorRef.current = editor
        onMount(editor)
      }}
    />
  )
}
