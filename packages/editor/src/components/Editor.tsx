import { useEffect, useRef, useState } from 'react'
import type * as Monaco from 'monaco-editor'
import { Loading, useEditorStore } from '@collaborative-editor/shared'
import { initMonaco } from '../lib/monaco/initMonaco'
import { EmptyState } from './common/EmptyState'
import { useYjsCollaboration } from '../hooks/useYjsCollaboration'
import { useMonacoBinding } from '../hooks/useMonacoBinding'
import { ImagePreview } from './features/ImagePreview'
import { MonacoEditorWrapper } from './features/MonacoEditorWrapper'
import type { EditorProps } from '../types'

export function Editor({ roomId, user, wsUrl, initialFiles, collaborationEnabled, onSave }: EditorProps) {
  const activeFile = useEditorStore((state) => state.activeFile)
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const editorDomRef = useRef<HTMLElement | null>(null)
  const [isEditorMounted, setIsEditorMounted] = useState(false)
  const [isMonacoReady, setIsMonacoReady] = useState(false)

  // 实例化 Yjs 线程
  const { provider, yDocRef, isReady } = useYjsCollaboration({
    roomId,
    user,
    wsUrl,
    initialFiles,
    collaborationEnabled,
  })

  const isImage = activeFile ? /\.(svg|png|jpg|jpeg|gif|webp)$/i.test(activeFile) : false

  useEffect(() => {
    if (!activeFile || isImage) return
    if (isMonacoReady) return

    let cancelled = false
    initMonaco()
      .then(() => {
        if (!cancelled) setIsMonacoReady(true)
      })
      .catch(() => {
        if (!cancelled) setIsMonacoReady(true)
      })

    return () => {
      cancelled = true
    }
  }, [activeFile, isImage, isMonacoReady])

  useMonacoBinding({
    editor: isImage ? null : editorRef.current,
    yDoc: yDocRef.current,
    provider: provider,
    activeFile,
    onSave,
    isReady,
    domReady: isEditorMounted,
    roomId,
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

  const isLoading = !isImage && (!isMonacoReady || !isEditorMounted)

  return (
    <>
      {isLoading && <Loading text="正在初始化编辑器..." />}
      <div style={{ display: isImage ? 'none' : isLoading ? 'none' : 'block', height: '100%' }}>
        {isMonacoReady && (
          <MonacoEditorWrapper
            activeFile={activeFile}
            onMount={(editor) => {
              editorRef.current = editor
              editorDomRef.current = editor.getDomNode()
              setIsEditorMounted(true)
            }}
          />
        )}
      </div>
      {isImage && <ImagePreview />}
    </>
  )
}
