import { createMonacoBinding } from './yjsBinding'

export type Ref<T> = { current: T }
export type Unbind = () => void
export type MonacoBinding = Awaited<ReturnType<typeof createMonacoBinding>>

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
