import * as Y from 'yjs'
import { useEditorStore } from '@collaborative-editor/shared'
import { observeAny, setAny } from './yjsAny'
import { anyEqual } from './anyEqual'

export const bindAnyStoreSync = (doc: Y.Doc) => {
  const binaryMap = doc.getMap<Uint8Array>('binary')
  const disposers = new Map<string, () => void>()

  const isText = (value: unknown): value is string => typeof value === 'string'
  const isBinary = (value: unknown): value is Uint8Array => value instanceof Uint8Array

  const ensureObserver = (path: string) => {
    if (disposers.has(path)) return
    const dispose = observeAny(doc, path, (value) => {
      console.log(path);
      if (!isText(value) && !(value instanceof Uint8Array)) return
      const current = useEditorStore.getState().files[path]
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

  const syncStoreToDoc = (files: Record<string, unknown>) => {
    const entries = Object.entries(files)
    entries.forEach(([path, content]) => {
      if (isText(content)) {
        ensureObserver(path)
        setAny(doc, path, content)
        return
      }
      if (isBinary(content) && !binaryMap.has(path)) {
        ensureObserver(path)
        setAny(doc, path, content)
      }
    })
  }
  
  // 更新的时候确保所有路径都被监听，包括新添加的路径
  doc.on('update', ensureDocPaths)
  // 初始化调用，确保所有路径都被监听
  ensureDocPaths()

  return () => {
    doc.off('update', ensureDocPaths)
    disposers.forEach((dispose) => dispose())
    disposers.clear()
  }
}
