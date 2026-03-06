import { useEffect, useRef } from 'react'
import type * as Monaco from 'monaco-editor'
import * as Y from 'yjs'
import type { WebsocketProvider } from 'y-websocket'
import { createMonacoBinding, syncCursorToAwareness } from '../lib/yjs'
import { useEditorStore, useFeatures } from '@collaborative-editor/shared'
import { initMonaco } from '../lib/monaco/initMonaco'

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
  const modelsRef = useRef<Map<string, Monaco.editor.ITextModel>>(new Map())

  const onSaveRef = useRef(onSave)
  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  useEffect(() => {
    if (!editor || !yDoc || !provider || !activeFile) return

    if (bindingRef.current) {
      bindingRef.current.destroy()
      bindingRef.current = null
    }

    let isMounted = true

    const bindNewFile = async () => {
      const monaco = await initMonaco()

      let model = modelsRef.current.get(activeFile)
      if (!model) {
        const uri = monaco.Uri.parse(`file:///${activeFile}`)
        const existingModel = monaco.editor.getModel(uri)
        if (!existingModel) {
          model = monaco.editor.createModel('', undefined, uri)
        } else {
          model = existingModel
        }
        if (model) {
          modelsRef.current.set(activeFile, model)
        }
      }

      if (model && !model.isDisposed()) {
        editor.setModel(model)
        const yText = yDoc.getText(activeFile)
        try {
          const snapshotContent = useEditorStore.getState().files[activeFile] || ''
          if (model.getValue().length === 0 && snapshotContent) {
            model.setValue(snapshotContent)
          }
        } catch {}

        if (isMounted) {
          const binding = await createMonacoBinding(yText, editor, provider)

          if (isMounted) {
            bindingRef.current = binding
            syncCursorToAwareness(editor, provider)
            const updateStore = () => {
              const content = yText.toString()
              useEditorStore.getState().addFile(activeFile, content)
            }
            updateStore()
            yText.observe(updateStore)
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
              const originalDestroy = binding.destroy.bind(binding)
              binding.destroy = () => {
                yText.unobserve(updateStore)
                if (saveTimeoutRef.current) {
                  clearTimeout(saveTimeoutRef.current)
                }
                disposable.dispose()
                originalDestroy()
              }
            } else {
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

