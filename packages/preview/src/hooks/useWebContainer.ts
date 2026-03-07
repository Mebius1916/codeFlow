import { useState, useEffect, useRef } from 'react'
import { WebContainer } from '@webcontainer/api'
import { generateServerScript } from '../webcontainer/server-script'

let webcontainerInstance: WebContainer | null = null

export function useWebContainer(files: Record<string, string>) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const bootPromise = useRef<Promise<void> | null>(null)

  const addLog = (msg: string) => {
    console.log(`[Preview] ${msg}`)
    setLogs((prev: string[]) => [...prev.slice(-4), msg])
  }

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

        webcontainerInstance.on('server-ready', (port: number, url: string) => {
          addLog(`Server ready at ${url}`)
          setPreviewUrl(url)
          setIsLoading(false)
        })

        const currentFiles = filesRef.current
        console.log('[Preview] Initializing with files:', Object.keys(currentFiles))

        addLog('Writing server script...')
        const serverScript = generateServerScript(currentFiles)
        await webcontainerInstance.fs.writeFile('server.js', serverScript)

        addLog('Writing project files...')

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

        const sortedDirs = Array.from(directories).sort((a, b) => a.length - b.length)

        for (const dir of sortedDirs) {
          await webcontainerInstance.fs.mkdir(dir, { recursive: true })
        }

        for (const [path, content] of Object.entries(currentFiles)) {
          await webcontainerInstance.fs.writeFile(path, content)
        }

        addLog('Starting server process...')
        const process = await webcontainerInstance.spawn('node', ['server.js'])

        process.output.pipeTo(
          new WritableStream({
            write(data) {
              addLog(`[Server] ${data}`)
            },
          }),
        )

        const exitCode = await Promise.race([
          process.exit,
          new Promise<number | null>((resolve) => setTimeout(() => resolve(null), 2000)),
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
  }, [])

  useEffect(() => {
    if (!webcontainerInstance) return

    const syncFiles = async () => {
      const start = performance.now()
      const fileCount = Object.keys(files).length
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
      const duration = performance.now() - start
      console.log(`[Preview] Sync done: ${fileCount} files in ${duration.toFixed(1)}ms`)
    }

    const timer = setTimeout(syncFiles, 500)
    return () => clearTimeout(timer)
  }, [files])

  return { previewUrl, isLoading, error, logs }
}
