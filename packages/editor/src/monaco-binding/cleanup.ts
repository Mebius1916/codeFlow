export type Ref<T> = { current: T }
export type Unbind = () => void

export const disposeUnbindRef = (unbindRef: Ref<Unbind | null>) => {
  if (unbindRef.current) {
    unbindRef.current()
    unbindRef.current = null
  }
}
