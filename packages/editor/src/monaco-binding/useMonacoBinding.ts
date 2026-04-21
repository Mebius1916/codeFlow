import { useEffect, useRef } from 'react'
import type * as Monaco from 'monaco-editor'
import { initMonaco } from '../utils/initMonaco'
import { disposeUnbindRef } from './cleanup'
import { getOrCreateModel, attachModelToEditor, setModelFromStore } from './monacoModel'
import { bindSingleMode } from './modelState'
interface UseMonacoBindingProps {
  editor: Monaco.editor.IStandaloneCodeEditor | null
  activeFile: string | null
  domReady: boolean
}

export function useMonacoBinding({ editor, activeFile, domReady }: UseMonacoBindingProps) {
  const unbindRef = useRef<null | (() => void)>(null)
  const modelRef = useRef<Monaco.editor.ITextModel | null>(null)

  useEffect(() => {
    if (!editor || !activeFile || !domReady) return

    disposeUnbindRef(unbindRef)

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
        return bindSingleMode({ activeFile, model })
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
    }
  }, [editor, activeFile, domReady])
}
