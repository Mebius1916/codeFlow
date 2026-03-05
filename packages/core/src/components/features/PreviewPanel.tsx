import { useEffect, useRef, useState } from 'react'
import { useEditorStore } from '../../lib/store'
import { WebContainer } from '@webcontainer/api'
import { SERVER_SCRIPT } from '../../lib/webcontainer/server-script'

let webcontainerInstance: WebContainer | null = null

export function PreviewPanel() {
  const { files } = useEditorStore()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const bootPromise = useRef<Promise<void> | null>(null)

  const addLog = (msg: string) => {
    console.log(`[Preview] ${msg}`)
    setLogs(prev => [...prev.slice(-4), msg])
  }

  useEffect(() => {
    async function initWebContainer() {
      // 防止重复初始化
      if (webcontainerInstance || bootPromise.current) return

      // 必须确保在浏览器环境中
      if (typeof window === 'undefined') return

      setIsLoading(true)
      setError(null)

      try {
        addLog('Booting WebContainer...')
        
        // 检查环境是否支持
        if (!window.crossOriginIsolated) {
          // 在开发环境中，可能因为 headers 配置问题导致不支持
          // 但我们仍然尝试启动，或者给出一个更友好的提示
          console.warn('Cross-Origin Isolation not enabled. WebContainer might not work properly.')
        }

        // 启动 WebContainer
        webcontainerInstance = await WebContainer.boot()
        addLog('WebContainer booted!')

        // 监听 server-ready 事件
        webcontainerInstance.on('server-ready', (port, url) => {
          addLog(`Server ready at ${url}`)
          setPreviewUrl(url)
          setIsLoading(false)
        })

        // 1. 写入服务器脚本
        addLog('Writing server script...')
        await webcontainerInstance.fs.writeFile('server.js', SERVER_SCRIPT)
        
        // 2. 写入项目文件
        addLog('Writing project files...')
        const currentFiles = useEditorStore.getState().files
        
        // 先创建所有必要的目录
        const directories = new Set<string>()
        for (const path of Object.keys(currentFiles)) {
          const parts = path.split('/')
          if (parts.length > 1) {
            // 逐级添加目录路径
            // 例如 src/components/Button.tsx -> 添加 src, src/components
            let currentPath = ''
            for (let i = 0; i < parts.length - 1; i++) {
              currentPath = currentPath ? `${currentPath}/${parts[i]}` : parts[i]
              directories.add(currentPath)
            }
          }
        }
        
        // 按深度排序创建目录，确保父目录先创建
        const sortedDirs = Array.from(directories).sort((a, b) => a.length - b.length)
        for (const dir of sortedDirs) {
          await webcontainerInstance.fs.mkdir(dir, { recursive: true })
        }

        // 写入所有文件
        for (const [path, content] of Object.entries(currentFiles)) {
          await webcontainerInstance.fs.writeFile(path, content)
        }

        // 调试：列出文件结构
        addLog('Checking file system...')
        const lsProcess = await webcontainerInstance.spawn('ls', ['-R'])
        lsProcess.output.pipeTo(new WritableStream({
          write(data) {
            addLog(`[ls] ${data}`)
          }
        }))
        await lsProcess.exit

        // 3. 启动服务器进程
        addLog('Starting server process...')
        // 使用 jsh (Shell) 来启动，这样更容易处理错误和输出
        const process = await webcontainerInstance.spawn('node', ['server.js'])
        
        process.output.pipeTo(new WritableStream({
          write(data) {
            addLog(`[Server] ${data}`)
          }
        }))

        // 不等待 process.exit，因为服务器是长期运行的
        // 如果服务器立即退出，说明出错了
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
  }, []) // 只在挂载时初始化一次

  // 当文件变化时，同步写入 WebContainer
  // 注意：这里需要防抖，否则每次打字都写文件太频繁
  useEffect(() => {
    if (!webcontainerInstance) return

    const syncFiles = async () => {
      for (const [path, content] of Object.entries(files)) {
        try {
          // 简单处理：覆盖写入所有文件
          // 优化点：只写变更的文件
          await webcontainerInstance!.fs.writeFile(path, content)
        } catch (e) {
          console.error(`Failed to write file ${path}:`, e)
        }
      }
    }

    // 简单防抖：延迟 500ms 写入
    const timer = setTimeout(syncFiles, 500)
    return () => clearTimeout(timer)
  }, [files])

  // 刷新 iframe
  const handleRefresh = () => {
    if (iframeRef.current && previewUrl) {
      iframeRef.current.src = previewUrl
    }
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#1e1e1e] text-red-400 p-4 text-center">
        <div className="text-2xl mb-2">⚠️</div>
        <div className="font-bold mb-2">预览环境启动失败</div>
        <div className="text-xs font-mono bg-black/30 p-2 rounded mb-4 max-w-full overflow-auto">
          {error}
        </div>
        <div className="text-xs text-gray-500">
          请检查浏览器控制台或网络设置
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-gray-400">
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs">启动预览环境...</span>
          <div className="text-[10px] font-mono text-gray-600 max-w-[200px] truncate">
            {logs[logs.length - 1]}
          </div>
        </div>
      </div>
    )
  }

  if (!previewUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-gray-500 text-xs">
        等待服务器启动...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* 地址栏 / 工具栏 */}
      <div className="h-8 bg-[#f3f4f6] border-b flex items-center px-2 gap-2">
        <button 
          onClick={handleRefresh}
          className="p-1 hover:bg-gray-200 rounded text-gray-600"
          title="刷新"
        >
          🔄
        </button>
        <div className="flex-1 bg-white border rounded px-2 py-0.5 text-xs text-gray-500 truncate select-all">
          {previewUrl}
        </div>
        <a 
          href={previewUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="p-1 hover:bg-gray-200 rounded text-gray-600"
          title="在新标签页打开"
        >
          ↗
        </a>
      </div>
      
      <iframe
        ref={iframeRef}
        src={previewUrl}
        className="flex-1 w-full border-none bg-white"
        title="Preview"
        sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
      />
    </div>
  )
}
