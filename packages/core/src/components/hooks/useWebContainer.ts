import { useState, useEffect, useRef } from 'react'
import { WebContainer } from '@webcontainer/api'
import { generateServerScript } from '../../lib/webcontainer/server-script'

let webcontainerInstance: WebContainer | null = null

export function useWebContainer(files: Record<string, string>) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const bootPromise = useRef<Promise<void> | null>(null)

  const addLog = (msg: string) => {
    console.log(`[Preview] ${msg}`)
    setLogs(prev => [...prev.slice(-4), msg])
  }

  // 使用 useRef 保存最新的 files，供 initWebContainer 使用
  const filesRef = useRef(files)
  useEffect(() => {
    filesRef.current = files
  }, [files])

  useEffect(() => {
    async function initWebContainer() {
      if (webcontainerInstance || bootPromise.current) return
      if (typeof window === 'undefined') return

      setIsLoading(true)
      setError(null)

      try {
        addLog('Booting WebContainer...')
        
        if (!window.crossOriginIsolated) {
          console.warn('Cross-Origin Isolation not enabled. WebContainer might not work properly.')
        }

        webcontainerInstance = await WebContainer.boot()
        addLog('WebContainer booted!')

        webcontainerInstance.on('server-ready', (port, url) => {
          addLog(`Server ready at ${url}`)
          setPreviewUrl(url)
          setIsLoading(false)
        })

        // 获取最新的 files
        const currentFiles = filesRef.current
        console.log('[Preview] Initializing with files:', Object.keys(currentFiles))

        // 1. 写入服务器脚本
        addLog('Writing server script...')
        const serverScript = generateServerScript(currentFiles)
        await webcontainerInstance.fs.writeFile('server.js', serverScript)
        
        // 2. 写入项目文件
        addLog('Writing project files...')
        
        // 创建一个 Set 用于存储所有需要创建的目录路径
        const directories = new Set<string>()
        for (const path of Object.keys(currentFiles)) {
          const parts = path.split('/')
          if (parts.length > 1) {
            let currentPath = ''
            for (let i = 0; i < parts.length - 1; i++) {
              currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i]
              directories.add(currentPath)
            }
          }
        }
        
        // 保证先生成父目录
        const sortedDirs = Array.from(directories).sort((a, b) => a.length - b.length)

        // 先创建 文件/文件夹
        for (const dir of sortedDirs) {
          await webcontainerInstance.fs.mkdir(dir, { recursive: true })
        }

        // 再写入文件内容
        for (const [path, content] of Object.entries(currentFiles)) {
          await webcontainerInstance.fs.writeFile(path, content)
        }

        // 3. 启动服务器进程
        addLog('Starting server process...')
        const process = await webcontainerInstance.spawn('node', ['server.js'])
        
        process.output.pipeTo(new WritableStream({
          write(data) {
            addLog(`[Server] ${data}`)
          }
        }))

        const exitCode = await Promise.race([
          process.exit,
          new Promise<number | null>(resolve => setTimeout(() => resolve(null), 2000))
        ])

        if (exitCode !== null && exitCode !== 0) {
          throw new Error(`Server process exited immediately with code ${exitCode}`)
        }
        
      } catch (error) {
        console.error('Failed to boot WebContainer:', error)
        setError(error instanceof Error ? error.message : String(error))
        setIsLoading(false)
        webcontainerInstance = null
        bootPromise.current = null
      }
    }

    bootPromise.current = initWebContainer()
  }, []) // 只在挂载时初始化一次，files 的变化通过下面的 useEffect 同步

  // 文件同步
  useEffect(() => {
    if (!webcontainerInstance) return

    const syncFiles = async () => {
      const newServerScript = generateServerScript(files)
      try {
        await webcontainerInstance!.fs.writeFile('server.js', newServerScript)
      } catch {}

      for (const [path, content] of Object.entries(files)) {
        try {
          await webcontainerInstance!.fs.writeFile(path, content)
        } catch (e) {
          console.error(`Failed to write file ${path}:`, e)
        }
      }
    }

    const timer = setTimeout(syncFiles, 500)
    return () => clearTimeout(timer)
  }, [files])

  return { previewUrl, isLoading, error, logs }
}
