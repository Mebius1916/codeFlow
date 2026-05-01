import type * as Monaco from 'monaco-editor'
import { setFileContent } from '@/features/workspace/services/workspace-service'
import { useEditorStore } from '@/features/workspace/store/editor-store'
import type { Unbind } from './cleanup'

// 单机模式，只与zustand 绑定
export const bindSingleMode = (args: {
  activeFile: string
  model: Monaco.editor.ITextModel
}): Unbind => {
  let storeUpdateTimer: ReturnType<typeof setTimeout> | null = null

  const unsubscribeStore = useEditorStore.subscribe((state) => {
    const storeContent = state.files[args.activeFile]
    if (typeof storeContent !== 'string') return
    if (!storeContent) return
    if (!args.model.isDisposed() && args.model.getValue().length === 0) {
      args.model.setValue(storeContent)
    }
  })

  const disposable = args.model.onDidChangeContent(() => {
    if (storeUpdateTimer) {
      clearTimeout(storeUpdateTimer)
    }
    storeUpdateTimer = setTimeout(() => {
      if (args.model.isDisposed()) return
      setFileContent(args.activeFile, args.model.getValue())
    }, 500)
  })

  return () => {
    if (storeUpdateTimer) {
      clearTimeout(storeUpdateTimer)
      storeUpdateTimer = null
    }
    disposable.dispose()
    unsubscribeStore()
  }
}
