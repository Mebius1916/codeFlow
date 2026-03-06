import { useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor'
import * as Y from 'yjs'
import type { WebsocketProvider } from 'y-websocket'
import { createMonacoBinding, syncCursorToAwareness } from '../../lib/yjs'
import { useEditorStore } from '../../lib/store'

import { useFeatures } from '../../lib/context/FeatureContext'

interface UseMonacoBindingProps {
  editor: monaco.editor.IStandaloneCodeEditor | null
  yDoc: Y.Doc | null
  provider: WebsocketProvider | null
  activeFile: string | null
  onSave?: (files: Record<string, string>) => void
}

export function useMonacoBinding({ editor, yDoc, provider, activeFile, onSave }: UseMonacoBindingProps) {
  const bindingRef = useRef<Awaited<ReturnType<typeof createMonacoBinding>> | null>(null)
  const { autoSave } = useFeatures()
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const modelsRef = useRef<Map<string, monaco.editor.ITextModel>>(new Map())
  
  const onSaveRef = useRef(onSave)
  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  useEffect(() => {
    if (!editor || !yDoc || !provider || !activeFile) return

    // 销毁旧绑定
    if (bindingRef.current) {
      bindingRef.current.destroy()
      bindingRef.current = null
    }

    let isMounted = true

    const bindNewFile = async () => {
      console.log(`[useMonacoBinding] Start binding for file: ${activeFile}`)
      
      // 是否命中缓存
      let model = modelsRef.current.get(activeFile)
      if (!model) {
        const uri = monaco.Uri.parse(`file:///${activeFile}`)
        // 尝试查找现有的 model
        const existingModel = monaco.editor.getModel(uri)
        if (!existingModel) {
          console.log(`[useMonacoBinding] Creating new model for ${activeFile}`)
          // 创建新 model
          const language = undefined // 让 monaco 根据扩展名自动推断
          model = monaco.editor.createModel('', language, uri)
        } else {
          console.log(`[useMonacoBinding] Found existing model in Monaco registry for ${activeFile}`)
          model = existingModel
        }
        // 存到缓存
        if (model) {
          modelsRef.current.set(activeFile, model)
        }
      } else {
        console.log(`[useMonacoBinding] Using cached model for ${activeFile}`)
      }

      // 切换或打开另一个文件
      if (model && !model.isDisposed()) {
        editor.setModel(model)
        // 监听当前文件的变化
        const yText = yDoc.getText(activeFile)
        try {
          // 获取当前文件的快照内容
          const snapshotContent = useEditorStore.getState().files[activeFile] || ''
          if (model.getValue().length === 0 && snapshotContent) {
            console.log(`[useMonacoBinding] Hydrating model from snapshot (length: ${snapshotContent.length})`)
            model.setValue(snapshotContent)
          }
        } catch (e) {
          console.error('[useMonacoBinding] Error initializing content:', e)
        }

        // 将 yjs 与 monaco 绑定
        if (isMounted) {
          const binding = await createMonacoBinding(
            yText,
            editor,
            provider
          )
          
          if (isMounted) {
            bindingRef.current = binding
            // 同步光标
            syncCursorToAwareness(editor, provider)
            // 同步 Yjs 内容到 Zustand Store
            const updateStore = () => {
              const content = yText.toString()
              useEditorStore.getState().addFile(activeFile, content)
            }
            // 初始同步
            updateStore()
            // 监听 Yjs 内容变化同步到 Store
            yText.observe(updateStore)
            // 6. 设置自动保存
            if (autoSave) {
              const disposable = model.onDidChangeContent(() => {
                if (saveTimeoutRef.current) {
                  clearTimeout(saveTimeoutRef.current)
                }
                saveTimeoutRef.current = setTimeout(() => {
                  if (model && !model.isDisposed()) {
                    onSaveRef.current?.({ [activeFile]: model.getValue() })
                  }
                }, 1000)
              })
              // 扩展 destroy 逻辑以清理 observer
              const originalDestroy = binding.destroy.bind(binding)
              binding.destroy = () => {
                yText.unobserve(updateStore)
                if (saveTimeoutRef.current) {
                  clearTimeout(saveTimeoutRef.current)
                }
                disposable.dispose() // 清理 onDidChangeContent
                originalDestroy()
              }
            } else {
               // 如果没有 autoSave，也需要清理 updateStore
               const originalDestroy = binding.destroy.bind(binding)
               binding.destroy = () => {
                 yText.unobserve(updateStore)
                 originalDestroy()
               }
            }
          } else {
            binding.destroy()
          }
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
  }, [editor, yDoc, provider, activeFile, autoSave])
}
