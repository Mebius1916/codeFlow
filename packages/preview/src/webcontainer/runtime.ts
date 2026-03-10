import { WebContainer } from '@webcontainer/api'

type UrlSubscriber = (url: string) => void
type LogSubscriber = (msg: string) => void

const globalState: {
  instance: WebContainer | null
  bootPromise: Promise<WebContainer> | null
  lastPreviewUrl: string | null
  serverReadyBound: boolean
} = ((globalThis as unknown as { __previewWebContainerState?: typeof globalState }).__previewWebContainerState ??=
  {
    instance: null,
    bootPromise: null,
    lastPreviewUrl: null,
    serverReadyBound: false,
  })

const serverReadySubscribers = new Set<UrlSubscriber>()
const logSubscribers = new Set<LogSubscriber>()

// 获取上一个预览URL
export function getLastPreviewUrl() {
  return globalState.lastPreviewUrl
}

// 订阅服务器就绪事件
export function subscribeServerReady(cb: UrlSubscriber) {
  serverReadySubscribers.add(cb)
  return () => serverReadySubscribers.delete(cb)
}

// 订阅日志事件
export function subscribeLogs(cb: LogSubscriber) {
  logSubscribers.add(cb)
  return () => logSubscribers.delete(cb)
}

// 发布日志事件
export function publishLog(msg: string) {
  logSubscribers.forEach((cb) => cb(msg))
}

// 绑定服务器就绪事件
function bindServerReadyOnce(instance: WebContainer) {
  if (globalState.serverReadyBound) return
  globalState.serverReadyBound = true

  instance.on('server-ready', (_port: number, url: string) => {
    publishLog(`Server ready at ${url}`)
    globalState.lastPreviewUrl = url
    serverReadySubscribers.forEach((cb) => cb(url))
    serverReadySubscribers.clear()
  })
}

// 确保WebContainer实例存在
export async function ensureWebContainer() {
  if (globalState.instance) return globalState.instance
  if (globalState.bootPromise) return globalState.bootPromise

  globalState.bootPromise = (async () => {
    publishLog('Booting WebContainer...')
    const instance = await WebContainer.boot()
    globalState.instance = instance
    bindServerReadyOnce(instance)
    return instance
  })().catch((e) => {
    globalState.instance = null
    globalState.bootPromise = null
    globalState.serverReadyBound = false
    globalState.lastPreviewUrl = null
    throw e
  })

  return globalState.bootPromise
}

// 获取WebContainer实例
export function getWebContainer() {
  return globalState.instance
}
