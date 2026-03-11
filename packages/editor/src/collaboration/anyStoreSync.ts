import * as Y from 'yjs'
import { useEditorStore } from '@collaborative-editor/shared'
import { getAny, observeAny, setAny } from './yjsAny'
import { anyEqual } from './anyEqual'

export const bindAnyStoreSync = (doc: Y.Doc) => {
  const binaryMap = doc.getMap<Uint8Array>('binary')
  const textDisposers = new Map<string, () => void>()

  const ensureTextObserver = (path: string) => {
    if (textDisposers.has(path)) return
    const dispose = observeAny(doc, path, (value) => {
      if (typeof value !== 'string') return
      const current = useEditorStore.getState().files[path]
      if (typeof current === 'string' && current === value) return
      useEditorStore.getState().updateFileContent(path, value)
    })
    textDisposers.set(path, dispose)
  }

  const stopTextObserver = (path: string) => {
    const dispose = textDisposers.get(path)
    if (!dispose) return
    dispose()
    textDisposers.delete(path)
  }

  const applyBinaryFromMap = (event?: Y.YMapEvent<Uint8Array>) => {
    const keys = event ? Array.from(event.keysChanged) : Array.from(binaryMap.keys())
    keys.forEach((key) => {
      const value = getAny(doc, key)
      if (!(value instanceof Uint8Array)) return
      const current = useEditorStore.getState().files[key]
      if (typeof current === 'string' || current instanceof Uint8Array) {
        if (anyEqual(current, value)) return
      }
      useEditorStore.getState().updateFileContent(key, value)
    })
  }

  binaryMap.observe(applyBinaryFromMap)
  applyBinaryFromMap()

  const syncAnyFromStore = (files: Record<string, unknown>) => {
    Object.entries(files).forEach(([key, content]) => {
      if (typeof content === 'string' || content instanceof Uint8Array) {
        setAny(doc, key, content)
      }
      if (typeof content === 'string') {
        ensureTextObserver(key)
      } else if (content instanceof Uint8Array) {
        stopTextObserver(key)
      }
    })
  }

  syncAnyFromStore(useEditorStore.getState().files)

  const unsubscribe = useEditorStore.subscribe((storeState) => {
    syncAnyFromStore(storeState.files)
  })

  return () => {
    binaryMap.unobserve(applyBinaryFromMap)
    unsubscribe()
    Array.from(textDisposers.values()).forEach((dispose) => dispose())
    textDisposers.clear()
  }
}
