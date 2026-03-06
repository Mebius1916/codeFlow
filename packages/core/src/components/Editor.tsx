import { useEffect, useRef, useState } from 'react'
import type * as Monaco from 'monaco-editor'
import { useEditorStore } from '../lib/store'
import { Loading } from './common/Loading'
import { EmptyState } from './common/EmptyState'
import { useYjsCollaboration, useMonacoBinding } from './hooks'
import { ImagePreview } from './features/ImagePreview'
import { MonacoEditorWrapper } from './features/MonacoEditorWrapper'

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
  const [isEditorMounted, setIsEditorMounted] = useState(false)

  // 1. 初始化 Yjs 协同环境
  const { isReady, providerRef, yDocRef } = useYjsCollaboration({ 
    roomId, 
    user, 
    wsUrl 
  })

  // 检查是否为图片文件
  const isImage = activeFile ? /\.(svg|png|jpg|jpeg|gif|webp)$/i.test(activeFile) : false

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
    return <EmptyState />
  }

  if (isImage) {
    return <ImagePreview />
  }

  const isLoading = !isReady || !isEditorMounted

  return (
    <>
      {isLoading && <Loading text="正在初始化编辑器..." />}
      <div style={{ display: isLoading ? 'none' : 'block', height: '100%' }}>
        <MonacoEditorWrapper
          activeFile={activeFile}
          onMount={(editor) => {
            editorRef.current = editor
            editorDomRef.current = editor.getDomNode()
            setIsEditorMounted(true)
          }}
        />
      </div>
    </>
  )
}
