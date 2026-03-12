import * as Y from 'yjs'
import { useEditorStore } from '@collaborative-editor/shared'
import { observeAny, setAny } from './yjsAny'
import { anyEqual } from './anyEqual'

export const bindAnyStoreSync = (doc: Y.Doc) => {
  const binaryMap = doc.getMap<Uint8Array>('binary')
  const disposers = new Map<string, () => void>()

  const isText = (value: unknown): value is string => typeof value === 'string'

  const ensureObserver = (path: string) => {
    if (disposers.has(path)) return
    const dispose = observeAny(doc, path, (value) => {
      const current = useEditorStore.getState().files[path]

      if (!isText(value) && !(value instanceof Uint8Array)) return
      if (isText(current) && isText(value) && anyEqual(current, value)) return
      if (current instanceof Uint8Array && value instanceof Uint8Array && anyEqual(current, value)) return
      
      useEditorStore.getState().updateFileContent(path, value as string | Uint8Array)
    })
    disposers.set(path, dispose)
  }

  const ensureDocPaths = () => {
    doc.share.forEach((type, key) => {
      const isAbstractType = type && type.constructor.name === 'AbstractType'
      if (type instanceof Y.Text || isAbstractType) {
        ensureObserver(key)
      }
    })
    binaryMap.forEach((_value, key) => {
      ensureObserver(key)
    })
  }

  // 更新的时候确保所有路径都被监听，包括新添加的路径
  doc.on('update', ensureDocPaths)
  // 初始化调用，确保所有路径都被监听
  ensureDocPaths()

  const unsubscribeStore = useEditorStore.subscribe((state, prevState) => {
    const nextFiles = state.files
    const prevFiles = prevState.files
    if (nextFiles === prevFiles) return

    Object.entries(nextFiles).forEach(([path, content]) => {
      if (prevFiles[path] === content) return
      if (typeof content !== 'string' && !(content instanceof Uint8Array)) return
      setAny(doc, path, content)
    })
  })

  return () => {
    doc.off('update', ensureDocPaths)
    disposers.forEach((dispose) => dispose())
    disposers.clear()
    unsubscribeStore()
  }
}
