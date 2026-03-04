import { useEffect, useRef } from 'react'
import type * as Monaco from 'monaco-editor'
import * as Y from 'yjs'
import type { WebsocketProvider } from 'y-websocket'
import { createMonacoBinding, syncCursorToAwareness } from '../../lib/yjs'
import { useEditorStore } from '../../lib/store'

import { useFeatures } from '../../lib/context/FeatureContext'

interface UseMonacoBindingProps {
  editor: Monaco.editor.IStandaloneCodeEditor | null
  yDoc: Y.Doc | null
  provider: WebsocketProvider | null
  activeFile: string | null
  onSave?: (files: Record<string, string>) => void
}

export function useMonacoBinding({ editor, yDoc, provider, activeFile, onSave }: UseMonacoBindingProps) {
  const bindingRef = useRef<Awaited<ReturnType<typeof createMonacoBinding>> | null>(null)
  const { autoSave } = useFeatures()
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!editor || !yDoc || !provider || !activeFile) return

    // 销毁旧绑定
    if (bindingRef.current) {
      bindingRef.current.destroy()
      bindingRef.current = null
    }

    let isMounted = true

    const bindNewFile = async () => {
      const yText = yDoc.getText(activeFile)
      
      // 初始化内容逻辑
      try {
        const currentContent = useEditorStore.getState().files[activeFile] || ''
        if (yText.toString().length === 0 && currentContent) {
          yText.insert(0, currentContent)
        }
      } catch {}

      const binding = await createMonacoBinding(yText, editor, provider)
      
      if (!isMounted) {
        binding.destroy()
        return
      }

      bindingRef.current = binding
      syncCursorToAwareness(editor, provider)

      // 监听内容变化实现自动保存
      if (autoSave && onSave) {
        const delay = typeof autoSave === 'number' ? autoSave : 1000
        
        const handleChange = () => {
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
          }
          
          saveTimeoutRef.current = setTimeout(() => {
            const files = useEditorStore.getState().files
            onSave(files)
          }, delay)
        }
        
        yText.observe(handleChange)
        
        // 扩展 destroy 逻辑以清理 observer
        const originalDestroy = binding.destroy.bind(binding)
        binding.destroy = () => {
          yText.unobserve(handleChange)
          if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current)
          }
          originalDestroy()
        }
      }
    }

    bindNewFile()

    return () => {
      isMounted = false
      if (bindingRef.current) {
        bindingRef.current.destroy()
        bindingRef.current = null
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [editor, yDoc, provider, activeFile, autoSave, onSave])
}
