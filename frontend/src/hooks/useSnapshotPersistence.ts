import { useEffect, useRef, useMemo } from 'react'
import { useEditorStore } from '@collaborative-editor/shared'
import { getSnapshot, setSnapshot } from '@collaborative-editor/yjs-local-forage'
import { DEFAULT_FILES, DEFAULT_ASSETS } from '../utils/default'

export function useSnapshotPersistence({
  roomId,
  collaborationEnabled = false,
  debounceMs = 1000,
  initialFiles: customInitialFiles,
  initialAssets: customInitialAssets,
}: {
  roomId: string
  collaborationEnabled?: boolean
  debounceMs?: number
  initialFiles?: Record<string, string>
  initialAssets?: Record<string, string>
}) {
  const readyRef = useRef(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const initialFiles = useMemo(() => customInitialFiles ?? DEFAULT_FILES, [customInitialFiles])
  const initialAssets = useMemo(() => customInitialAssets ?? DEFAULT_ASSETS, [customInitialAssets])

  // 合并所有初始文件路径
  const allInitialFiles = useMemo(() => ({
    ...initialFiles,
    // 资源文件初始内容为空字符串，等待懒加载填充
    ...Object.keys(initialAssets).reduce((acc, key) => ({ ...acc, [key]: '' }), {} as Record<string, string>)
  }), [initialFiles, initialAssets])

  // 1. 初始化加载数据 (Snapshot)
  useEffect(() => {
    const init = async () => {
      const snapshot = await getSnapshot(roomId)
      const filesToLoad = snapshot && Object.keys(snapshot).length > 0 ? snapshot : (allInitialFiles ?? {})
      
      // 填充 store
      useEditorStore.getState().initializeFiles(filesToLoad)
      readyRef.current = true
    }

    init()
  }, [roomId, allInitialFiles])

  // 2. 监听变化并保存（仅在非协同模式下）
  useEffect(() => {
    if (collaborationEnabled) return

    const unsubscribe = useEditorStore.subscribe((state) => {
      if (!readyRef.current) return
      
      // 当 files 发生变化时，保存快照
      // 由于 store 更新是不可变的，我们可以直接保存 state.files
      // 添加防抖
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        setSnapshot(roomId, state.files)
        timerRef.current = null
      }, debounceMs)
    })

    return () => {
      unsubscribe()
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        // 卸载时立即保存
        setSnapshot(roomId, useEditorStore.getState().files)
        timerRef.current = null
      }
    }
  }, [roomId, collaborationEnabled, debounceMs])

  // 3. 资源懒加载逻辑
  useEffect(() => {
    let previousFile = useEditorStore.getState().activeFile

    const loadAssetContent = (activeFile: string, assetUrl: string) => {
      const files = useEditorStore.getState().files
      const currentContent = files[activeFile]
      
      // 如果已经有二进制内容，跳过 (或者内容不为空)
      if (currentContent instanceof Uint8Array || (typeof currentContent === 'string' && currentContent.length > 0)) return
      
      fetch(assetUrl)
        .then((res) => res.arrayBuffer())
        .then((buffer) => {
          const uint8Array = new Uint8Array(buffer)
          // 更新 Store，这会触发上面的 subscribe 保存快照
          useEditorStore.getState().updateFileContent(activeFile, uint8Array)
        })
        .catch((err) => {
          console.error('[Assets] 加载失败', { path: activeFile, url: assetUrl, error: err })
        })
    }

    const handleActiveFileChange = (activeFile: string | null) => {
      if (!activeFile || activeFile === previousFile) return
      previousFile = activeFile
      
      const assetUrl = initialAssets[activeFile]
      if (assetUrl) {
        loadAssetContent(activeFile, assetUrl)
      }
    }

    const unsubscribe = useEditorStore.subscribe((state) => {
      handleActiveFileChange(state.activeFile)
    })

    return () => {
      unsubscribe()
    }
  }, [initialAssets, roomId]) // collaborationEnabled 不影响资源加载

  return { initialFiles: allInitialFiles }
}
