import type * as Monaco from 'monaco-editor'
import * as Y from 'yjs'
import { useEditorStore } from '@collaborative-editor/shared'
import { createMonacoBinding, syncCursorToAwareness } from '../lib/yjs'
import type { AwarenessProvider } from '../lib/yjs/provider'
import type { OnSave, Ref, Unbind, MonacoBinding } from './monacoBindingCleanup'
import { clearSaveTimeout } from './monacoBindingCleanup'

export const setupAutosave = (
  model: Monaco.editor.ITextModel,
  filePath: string,
  delayMs: number,
  saveTimeoutRef: Ref<NodeJS.Timeout | null>,
  onSaveRef: Ref<OnSave>,
) => {
  return model.onDidChangeContent(() => {
    clearSaveTimeout(saveTimeoutRef)
    saveTimeoutRef.current = setTimeout(() => {
      if (!model.isDisposed()) {
        onSaveRef.current?.({ [filePath]: model.getValue() })
      }
    }, delayMs)
  })
}

export const bindSingleMode = (args: {
  activeFile: string
  model: Monaco.editor.ITextModel
  autoSave: boolean
  saveTimeoutRef: Ref<NodeJS.Timeout | null>
  onSaveRef: Ref<OnSave>
}): Unbind => {
  const updateStore = () => {
    useEditorStore.getState().updateFileContent(args.activeFile, args.model.getValue())
  }

  updateStore()

  const unsubscribeStore = useEditorStore.subscribe((state) => {
    const storeContent = state.activeContent
    if (typeof storeContent !== 'string') return
    if (!storeContent) return
    if (!args.model.isDisposed() && args.model.getValue().length === 0) {
      args.model.setValue(storeContent)
    }
  })

  const disposable = args.model.onDidChangeContent(() => {
    updateStore()
    if (args.autoSave) {
      clearSaveTimeout(args.saveTimeoutRef)
      args.saveTimeoutRef.current = setTimeout(() => {
        if (!args.model.isDisposed()) {
          args.onSaveRef.current?.({ [args.activeFile]: args.model.getValue() })
        }
      }, 1000)
    }
  })

  return () => {
    clearSaveTimeout(args.saveTimeoutRef)
    disposable.dispose()
    unsubscribeStore()
  }
}

export const bindCollabMode = async (args: {
  activeFile: string
  model: Monaco.editor.ITextModel
  editor: Monaco.editor.IStandaloneCodeEditor
  yDoc: Y.Doc
  provider: AwarenessProvider
  autoSave: boolean
  saveTimeoutRef: Ref<NodeJS.Timeout | null>
  onSaveRef: Ref<OnSave>
  bindingRef: Ref<MonacoBinding | null>
  isMounted: () => boolean
}) => {
  const yText = args.yDoc.getText(args.activeFile)
  if (!args.isMounted()) return

  const binding = await createMonacoBinding(yText, args.editor, args.provider)
  if (!args.isMounted()) {
    binding.destroy()
    return
  }

  args.bindingRef.current = binding as MonacoBinding
  syncCursorToAwareness(args.editor, args.provider)

  const updateStore = () => {
    const content = yText.toString()
    useEditorStore.getState().updateFileContent(args.activeFile, content)
  }

  updateStore()
  yText.observe(updateStore)

  const originalDestroy = binding.destroy.bind(binding)
  binding.destroy = () => {
    yText.unobserve(updateStore)
    clearSaveTimeout(args.saveTimeoutRef)
    originalDestroy()
  }

  if (args.autoSave) {
    const disposable = setupAutosave(args.model, args.activeFile, 500, args.saveTimeoutRef, args.onSaveRef)
    const prevDestroy = binding.destroy.bind(binding)
    binding.destroy = () => {
      disposable.dispose()
      prevDestroy()
    }
  }
}

