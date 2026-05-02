interface CurrentRef<T> {
  current: T
}

export const disposeUnbindRef = (unbindRef: CurrentRef<(() => void) | null>) => {
  if (unbindRef.current) {
    unbindRef.current()
    unbindRef.current = null
  }
}
