import { useState, useEffect, useRef, useCallback } from 'react'
import { WebContainer } from '@webcontainer/api'
import { generateServerScript } from '../webcontainer/server-script'
import { useIdleDebounce } from './useIdleDebounce'

let webcontainerInstance: WebContainer | null = null
let lastPreviewUrl: string | null = null
const serverReadySubscribers = new Set<(url: string) => void>()

export function useWebContainer(files: Record<string, string | Uint8Array>) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const bootPromise = useRef<Promise<void> | null>(null)
  const previousFilesRef = useRef<Record<string, string | Uint8Array>>({})

  const addLog = (msg: string) => {
    setLogs((prev: string[]) => [...prev.slice(-4), msg])
  }

  const filesRef = useRef(files)

  const runSync = useCallback(async () => {
    if (!webcontainerInstance) return
    const currentFiles = filesRef.current
    const previousFiles = previousFilesRef.current
    const changedEntries: Array<[string, string | Uint8Array]> = []

    for (const [path, content] of Object.entries(currentFiles)) {
      if (previousFiles[path] !== content) {
        changedEntries.push([path, content])
      }
    }

    if (changedEntries.length === 0) {
      return
    }

    for (const [path, content] of changedEntries) {
      try {
        await webcontainerInstance.fs.writeFile(path, content)
        previousFiles[path] = content
      } catch (e) {
        console.error(`Failed to write file ${path}:`, e)
      }
    }
  }, [])

  const { schedule: scheduleSync } = useIdleDebounce(runSync, 200)

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

        webcontainerInstance = await WebContainer.boot()

        webcontainerInstance.on('server-ready', (port: number, url: string) => {
          addLog(`Server ready at ${url}`)
          lastPreviewUrl = url
          setPreviewUrl(url)
          setIsLoading(false)
          serverReadySubscribers.forEach((cb) => cb(url))
          serverReadySubscribers.clear()
        })

        const currentFiles = filesRef.current
        const entries = Object.entries(currentFiles)
        const serverScript = generateServerScript(
          Object.fromEntries(entries.filter(([, content]) => typeof content === 'string')) as Record<string, string>,
        )
        await webcontainerInstance.fs.writeFile('server.js', serverScript)

        const directories = new Set<string>()
        for (const [path] of entries) {
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

        // 并发请求池
        const writeEntries = async (items: Array<[string, string | Uint8Array]>, limit: number) => {
          let index = 0
          const worker = async () => {
            while (index < items.length) {
              const [path, content] = items[index]
              index += 1
              await webcontainerInstance!.fs.writeFile(path, content)
            }
          }
          const workers = Array.from({ length: Math.min(limit, items.length) }, worker)
          await Promise.all(workers)
        }

        await writeEntries(entries, 8)

        previousFilesRef.current = { ...currentFiles }

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
    if (lastPreviewUrl) {
      setPreviewUrl(lastPreviewUrl)
      return
    }
    if (!webcontainerInstance) return

    const subscriber = (url: string) => {
      setPreviewUrl(url)
    }
    serverReadySubscribers.add(subscriber)
    return () => {
      serverReadySubscribers.delete(subscriber)
    }
  }, [])

  useEffect(() => {
    scheduleSync()
  }, [files, scheduleSync])

  return { previewUrl, isLoading, error, logs }
}
