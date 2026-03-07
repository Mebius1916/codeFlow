import { useEffect, useRef } from 'react'
import type * as Monaco from 'monaco-editor'
import * as Y from 'yjs'
import { createMonacoBinding, syncCursorToAwareness } from '../lib/yjs'
import { useEditorStore, useFeatures } from '@collaborative-editor/shared'
import { initMonaco } from '../lib/monaco/initMonaco'
import type { AwarenessProvider } from '../lib/yjs/provider'

interface UseMonacoBindingProps {
  editor: Monaco.editor.IStandaloneCodeEditor | null
  yDoc: Y.Doc | null
  provider: AwarenessProvider | null
  activeFile: string | null
  onSave?: (files: Record<string, string>) => void
  isReady: boolean
  domReady: boolean
}

export function useMonacoBinding({ editor, yDoc, provider, activeFile, onSave, isReady, domReady }: UseMonacoBindingProps) {
  const bindingRef = useRef<Awaited<ReturnType<typeof createMonacoBinding>> | null>(null)
  const { autoSave } = useFeatures()
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const modelsRef = useRef<Map<string, Monaco.editor.ITextModel>>(new Map())
  const previousFileRef = useRef<string | null>(null)

  const onSaveRef = useRef(onSave)
  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  useEffect(() => {
    if (!activeFile) return
    const previousFile = previousFileRef.current
    if (previousFile && previousFile !== activeFile) {
      const previousModel = modelsRef.current.get(previousFile)
      if (previousModel && !previousModel.isDisposed()) {
        previousModel.dispose()
      }
      modelsRef.current.delete(previousFile)
      useEditorStore.getState().updateFileContent(previousFile, '')
    }
    previousFileRef.current = activeFile
  }, [activeFile])

  useEffect(() => {
    if (!editor || !activeFile || !domReady) return

    const isCollaborationReady = Boolean(yDoc && provider && isReady)

    if (bindingRef.current) {
      bindingRef.current.destroy()
      bindingRef.current = null
    }

    let isMounted = true

    const bindNewFile = async () => {
      const start = performance.now()
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
        model.updateOptions({
          tabSize: 2,
          insertSpaces: true,
        })
        const domNode = editor.getDomNode()
        if (domNode) {
          editor.layout()
        }
        try {
          const snapshotContent = useEditorStore.getState().files[activeFile]
          if (typeof snapshotContent === 'string' && model.getValue().length === 0 && snapshotContent) {
            console.log(`[Editor] 📝 Fill snapshot for ${activeFile} (${snapshotContent.length} chars)`)
            model.setValue(snapshotContent)
          }
        } catch {}

        if (!isCollaborationReady) {
          const updateStore = () => {
            useEditorStore.getState().updateFileContent(activeFile, model!.getValue())
          }
          updateStore();
          const unsubscribeStore = useEditorStore.subscribe((state) => {
            const storeContent = state.files[activeFile]
            if (typeof storeContent !== 'string') return
            if (!storeContent) return
            if (model && !model.isDisposed() && model.getValue().length === 0) {
              model.setValue(storeContent)
            }
          })
          const disposable = model.onDidChangeContent(() => {
            updateStore()
            if (autoSave) {
              if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current)
              }
              saveTimeoutRef.current = setTimeout(() => {
                if (model && !model.isDisposed()) {
                  onSaveRef.current?.({ [activeFile]: model.getValue() })
                }
              }, 1000)
            }
          })
          return () => {
            disposable.dispose()
            unsubscribeStore()
          }
        }

        const yText = yDoc!.getText(activeFile)
        if (isMounted) {
          console.log(`[Editor] 🔗 Bind Yjs for ${activeFile}`)
          const binding = await createMonacoBinding(yText, editor, provider!)

          if (isMounted) {
            bindingRef.current = binding
            syncCursorToAwareness(editor, provider!)
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
      const duration = performance.now() - start
      console.log(`[Editor] Switch file ${activeFile} in ${duration.toFixed(1)}ms`)
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
  }, [editor, yDoc, provider, activeFile, autoSave, isReady, domReady])
}
