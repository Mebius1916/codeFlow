import { useEffect, useRef } from 'react'
import type * as Monaco from 'monaco-editor'
import * as Y from 'yjs'
import { initMonaco } from '../utils/initMonaco'
import {
  destroyBindingRef,
  disposeUnbindRef,
  type MonacoBinding,
} from './cleanup'
import { getOrCreateModel, attachModelToEditor, setModelFromStore } from './monacoModel'
import { bindCollabMode, bindSingleMode } from './modelState'
import type { Awareness } from 'y-protocols/awareness'
type AwarenessProvider = {
  awareness: Awareness
}
interface UseMonacoBindingProps {
  editor: Monaco.editor.IStandaloneCodeEditor | null
  yDoc: Y.Doc | null
  provider: AwarenessProvider | null
  activeFile: string | null
  isReady: boolean
  domReady: boolean
}

export function useMonacoBinding({ editor, yDoc, provider, activeFile, isReady, domReady }: UseMonacoBindingProps) {
  const bindingRef = useRef<MonacoBinding | null>(null)
  const unbindRef = useRef<null | (() => void)>(null)
  const modelRef = useRef<Monaco.editor.ITextModel | null>(null)

  useEffect(() => {
    if (!editor || !activeFile || !domReady) return

    const isCollaborationReady = Boolean(yDoc && provider && isReady)

    disposeUnbindRef(unbindRef)
    destroyBindingRef(bindingRef)

    let isMounted = true

    const bindNewFile = async (): Promise<void | (() => void)> => {
      // 初始化monaco
      const monaco = await initMonaco()
      // 创建或获取模型
      const model = getOrCreateModel(monaco, modelRef)

      if (model && !model.isDisposed()) {
        // 给 monaco 绑定模型
        attachModelToEditor(monaco, editor, model, activeFile)
        try {
          // 从store中设置模型内容
          setModelFromStore(model, activeFile)
        } catch { }

        if (!isCollaborationReady) {
          return bindSingleMode({
            activeFile,
            model,
          })
        }

        await bindCollabMode({
          activeFile,
          model,
          editor,
          yDoc: yDoc!,
          provider: provider!,
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
    }
  }, [editor, yDoc, provider, activeFile, isReady, domReady])
}
