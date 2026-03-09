import { createMonacoBinding } from '../lib/yjs'

export type Ref<T> = { current: T }
export type Unbind = () => void
export type OnSave = ((files: Record<string, string>) => void) | undefined
export type MonacoBinding = Awaited<ReturnType<typeof createMonacoBinding>>

export const clearSaveTimeout = (saveTimeoutRef: Ref<NodeJS.Timeout | null>) => {
  if (saveTimeoutRef.current) {
    clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = null
  }
}

export const disposeUnbindRef = (unbindRef: Ref<Unbind | null>) => {
  if (unbindRef.current) {
    unbindRef.current()
    unbindRef.current = null
  }
}

export const destroyBindingRef = (bindingRef: Ref<MonacoBinding | null>) => {
  if (bindingRef.current) {
    bindingRef.current.destroy()
    bindingRef.current = null
  }
}

