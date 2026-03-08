import { useRef, useCallback, useEffect } from 'react'

/**
 * 提供延迟去抖并在空闲时执行任务的钩子
 * @param callback 要执行的任务
 * @param delay 延迟时间（毫秒）
 * @returns { schedule: 调度函数, cancel: 取消函数 }
 */
export function useIdleDebounce(callback: () => void | Promise<void>, delay: number = 200) {
  const debounceTimerRef = useRef<number | null>(null)
  const idleCallbackRef = useRef<number | null>(null)

  // 取消空闲回调或降级的定时器
  const cancelIdle = useCallback(() => {
    if (idleCallbackRef.current === null) return
    const cancelIdleCallback = (window as Window & { cancelIdleCallback?: (handle: number) => void }).cancelIdleCallback
    if (cancelIdleCallback) {
      cancelIdleCallback(idleCallbackRef.current)
    } else {
      clearTimeout(idleCallbackRef.current)
    }
    idleCallbackRef.current = null
  }, [])

  // 取消所有待处理的调度
  const cancel = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }
    cancelIdle()
  }, [cancelIdle])

  // 开始调度任务
  const schedule = useCallback(() => {
    if (debounceTimerRef.current !== null) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = window.setTimeout(() => {
      cancelIdle()
      const requestIdleCallback = (window as Window & { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number }).requestIdleCallback
      if (requestIdleCallback) {
        idleCallbackRef.current = requestIdleCallback(() => {
          idleCallbackRef.current = null
          void callback()
        }, { timeout: 500 })
        return
      }
      void callback()
    }, delay)
  }, [callback, delay, cancelIdle])

  // 组件卸载时清理资源
  useEffect(() => {
    return () => cancel()
  }, [cancel])

  return { schedule, cancel }
}
