import { WebContainer } from '@webcontainer/api'
import { useRuntimeStore } from '@/lib/store/runtime-store'
import { useEditorStore } from '@/lib/store/editor-store'

let webcontainerInstance: WebContainer | null = null

/**
 * 获取或创建 WebContainer 实例
 */
async function getWebContainer(): Promise<WebContainer> {
  if (webcontainerInstance) {
    return webcontainerInstance
  }

  const { setContainer, setBooting, addTerminalOutput } = useRuntimeStore.getState()

  try {
    setBooting(true)
    addTerminalOutput({ type: 'system', content: '🚀 初始化 WebContainer...' })
    
    webcontainerInstance = await WebContainer.boot()
    setContainer(webcontainerInstance)
    
    addTerminalOutput({ type: 'system', content: '✅ WebContainer 启动成功' })
    
    return webcontainerInstance
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    addTerminalOutput({ type: 'stderr', content: `❌ WebContainer 启动失败: ${message}` })
    throw error
  } finally {
    setBooting(false)
  }
}

/**
 * 执行代码
 */
export async function executeCode() {
  const { files, activeFile } = useEditorStore.getState()
  const { addTerminalOutput, setCurrentProcess } = useRuntimeStore.getState()

  if (!activeFile) {
    addTerminalOutput({ type: 'stderr', content: '❌ 请先打开一个文件' })
    return
  }

  const fileContent = files[activeFile]
  if (!fileContent) {
    addTerminalOutput({ type: 'stderr', content: '❌ 文件内容为空' })
    return
  }

  try {
    // 获取 WebContainer
    const container = await getWebContainer()

    // 写入当前文件
    await container.fs.writeFile(activeFile, fileContent)

    // 执行命令
    const startTime = Date.now()
    addTerminalOutput({ 
      type: 'system', 
      content: `\n$ node ${activeFile}` 
    })

    const process = await container.spawn('node', [activeFile])

    // 设置当前进程
    setCurrentProcess({
      id: `${Date.now()}`,
      command: 'node',
      args: [activeFile],
      startTime,
      status: 'running',
    })

    // 捕获输出
    process.output.pipeTo(
      new WritableStream({
        write(data) {
          addTerminalOutput({ 
            type: 'stdout', 
            content: data 
          })
        },
      })
    )

    // 等待执行完成
    const exitCode = await process.exit
    const duration = Date.now() - startTime

    if (exitCode === 0) {
      addTerminalOutput({ 
        type: 'system', 
        content: `✅ 执行成功 (${duration}ms)\n` 
      })
      setCurrentProcess({
        id: `${Date.now()}`,
        command: 'node',
        args: [activeFile],
        startTime,
        endTime: Date.now(),
        exitCode,
        status: 'completed',
      })
    } else {
      addTerminalOutput({ 
        type: 'stderr', 
        content: `❌ 执行失败 (退出码: ${exitCode}, ${duration}ms)\n` 
      })
      setCurrentProcess({
        id: `${Date.now()}`,
        command: 'node',
        args: [activeFile],
        startTime,
        endTime: Date.now(),
        exitCode,
        status: 'failed',
      })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : '未知错误'
    addTerminalOutput({ 
      type: 'stderr', 
      content: `❌ 执行错误: ${message}\n` 
    })
    
    setCurrentProcess(null)
  }
}

