import { useEffect, useRef } from 'react'
import type * as Monaco from 'monaco-editor'
import * as Y from 'yjs'
import { useFeatures } from '@collaborative-editor/shared'
import { initMonaco } from '../lib/monaco/initMonaco'
import type { AwarenessProvider } from '../lib/yjs/provider'
import {
  clearSaveTimeout,
  destroyBindingRef,
  disposeUnbindRef,
  type MonacoBinding,
} from './monacoBindingCleanup'
import { getOrCreateModel, attachModelToEditor, setModelFromStore } from './monacoBindingModel'
import { bindCollabMode, bindSingleMode } from './monacoBindingModes'

interface UseMonacoBindingProps {
  editor: Monaco.editor.IStandaloneCodeEditor | null
  yDoc: Y.Doc | null
  provider: AwarenessProvider | null
  activeFile: string | null
  onSave?: (files: Record<string, string>) => void
  isReady: boolean
  domReady: boolean
  roomId?: string
}

export function useMonacoBinding({ editor, yDoc, provider, activeFile, onSave, isReady, domReady, roomId: _roomId }: UseMonacoBindingProps) {
  const bindingRef = useRef<MonacoBinding | null>(null)
  const unbindRef = useRef<null | (() => void)>(null)
  const { autoSave } = useFeatures()
  const autoSaveEnabled = Boolean(autoSave)
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const modelRef = useRef<Monaco.editor.ITextModel | null>(null)

  const onSaveRef = useRef(onSave)
  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  useEffect(() => {
    if (!editor || !activeFile || !domReady) return

    const isCollaborationReady = Boolean(yDoc && provider && isReady)

    disposeUnbindRef(unbindRef)
    destroyBindingRef(bindingRef)

    let isMounted = true

    const bindNewFile = async (): Promise<void | (() => void)> => {
      const monaco = await initMonaco()

      const model = getOrCreateModel(monaco, modelRef)

      if (model && !model.isDisposed()) {
        attachModelToEditor(monaco, editor, model, activeFile)
        try {
          setModelFromStore(model)
        } catch { }

        if (!isCollaborationReady) {
          return bindSingleMode({
            activeFile,
            model,
            autoSave: autoSaveEnabled,
            saveTimeoutRef,
            onSaveRef,
          })
        }

        await bindCollabMode({
          activeFile,
          model,
          editor,
          yDoc: yDoc!,
          provider: provider!,
          autoSave: autoSaveEnabled,
          saveTimeoutRef,
          onSaveRef,
          bindingRef,
          isMounted: () => isMounted,
        })
      }
    }

    bindNewFile().then((unbind) => {
      if (!isMounted) {
        if (typeof unbind === 'function') unbind()
        return
      }
      if (typeof unbind === 'function') {
        unbindRef.current = unbind
      }
    })

    return () => {
      isMounted = false
      disposeUnbindRef(unbindRef)
      destroyBindingRef(bindingRef)
      clearSaveTimeout(saveTimeoutRef)
    }
  }, [editor, yDoc, provider, activeFile, autoSave, isReady, domReady])
}
