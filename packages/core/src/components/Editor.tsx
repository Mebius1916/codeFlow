import { useEffect, useRef } from 'react'
import MonacoEditor from '@monaco-editor/react'
import type * as Monaco from 'monaco-editor'
import { useEditorStore } from '../lib/store'
import { getLanguageFromPath } from '../lib/utils/file'
import { Loading } from './common/Loading'
import { useYjsCollaboration, useMonacoBinding } from './hooks'
import { ImagePreview } from './features/ImagePreview'

interface EditorProps {
  roomId: string
  user: {
    id: string
    name?: string
    color?: string
  }
  wsUrl?: string
  onSave?: (files: Record<string, string>) => void
}

export function Editor({ roomId, user, wsUrl, onSave }: EditorProps) {
  const { activeFile } = useEditorStore()
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const editorDomRef = useRef<HTMLElement | null>(null)

  // 1. 初始化 Yjs 协同环境
  const { isReady, providerRef, yDocRef } = useYjsCollaboration({ 
    roomId, 
    user, 
    wsUrl 
  })

  // 检查是否为图片文件
  const isImage = activeFile ? /\.(svg|png|jpg|jpeg|gif|webp)$/i.test(activeFile) : false

  // 2. 绑定编辑器与 Yjs 文档
  // 只有在非图片模式下才传递 editor 实例，防止在图片预览模式下尝试绑定已销毁的编辑器
  useMonacoBinding({
    editor: isImage ? null : editorRef.current,
    yDoc: yDocRef.current,
    provider: providerRef.current,
    activeFile,
    onSave
  })

  useEffect(() => {
    const handleKeydownCapture = (e: KeyboardEvent) => {
      const dom = editorDomRef.current
      if (!dom) return

      const target = e.target
      if (!(target instanceof Node)) return
      if (!dom.contains(target)) return

      if (!/^F([1-9]|1[0-2])$/.test(e.key)) return

      e.stopImmediatePropagation()
      e.stopPropagation()
    }

    window.addEventListener('keydown', handleKeydownCapture, { capture: true })
    return () => {
      window.removeEventListener('keydown', handleKeydownCapture, { capture: true } as AddEventListenerOptions)
    }
  }, [])

  if (!activeFile) {
    return (
      <div 
        className="flex items-center justify-center h-full text-gray-500"
        style={{ backgroundColor: 'rgb(21, 23, 42)' }}
      >
        <div className="flex flex-col items-center gap-2">
          <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>请选择或创建一个文件</span>
        </div>
      </div>
    )
  }

  if (!isReady) {
    return <Loading text="正在同步协同数据..." />
  }

  if (isImage) {
    return <ImagePreview />
  }

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
      loading={<Loading text="正在初始化编辑器核心..." />}
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
        editorDomRef.current = editor.getDomNode()
      }}
    />
  )
}
