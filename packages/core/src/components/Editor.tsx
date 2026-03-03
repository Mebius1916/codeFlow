import { useEffect, useRef, useState, lazy } from 'react'
import type * as Monaco from 'monaco-editor'
import type { WebsocketProvider } from 'y-websocket'
import type { IndexeddbPersistence } from 'y-indexeddb'
import * as Y from 'yjs'
import { useEditorStore, useCollaborationStore } from '../lib/store'
import { getLanguageFromPath } from '../lib/utils/file'
import { createYjsProvider, destroyProvider, createMonacoBinding, syncCursorToAwareness } from '../lib/yjs'
import { Loading } from './common/Loading'

const MonacoEditor = lazy(() => import('@monaco-editor/react'))

interface EditorProps {
  roomId: string
  user: {
    id: string
    name?: string
    color?: string
  }
  wsUrl?: string
}

export function Editor({ roomId, user, wsUrl }: EditorProps) {
  const { activeFile } = useEditorStore()
  const { setYDoc, setConnectionStatus, setCurrentUser, setUsers } = useCollaborationStore()
  const [isReady, setIsReady] = useState(false)
  
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
  const indexeddbProviderRef = useRef<IndexeddbPersistence | null>(null)
  const bindingRef = useRef<Awaited<ReturnType<typeof createMonacoBinding>> | null>(null)
  const yDocRef = useRef<Y.Doc | null>(null)

  // 初始化 Yjs 协同
  useEffect(() => {
    if (!roomId) return

    let mounted = true

    const initCollaboration = async () => {
      // 用户信息（外部传入，user.id 是必需的）
      const userId = user.id
      const userName = user.name || `用户${Math.floor(Math.random() * 1000)}`
      const userColor = user.color || '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')

      // WebSocket 地址（外部传入或使用默认值）
      const websocketUrl = wsUrl || 'ws://localhost:1234'

      // 创建 Provider
      const { yDoc, provider, indexeddbProvider } = await createYjsProvider({
        roomId,
        userId,
        userName,
        userColor,
        wsUrl: websocketUrl,
      })

      if (!mounted) {
        destroyProvider(provider, indexeddbProvider)
        return
      }

      yDocRef.current = yDoc
      providerRef.current = provider
      indexeddbProviderRef.current = indexeddbProvider
      setYDoc(yDoc)
      setIsReady(true)

      // 设置当前用户
      const currentUser = {
        id: userId,
        name: userName,
        color: userColor,
      }
      setCurrentUser(currentUser)

      // 监听连接状态
      provider.on('status', ({ status }: { status: string }) => {
        const connectionStatus = status === 'connected' ? 'connected' : 
                                status === 'connecting' ? 'connecting' : 'disconnected'
        setConnectionStatus(connectionStatus)
      })

      // 监听 Awareness 变化（其他用户）
      provider.awareness.on('change', () => {
        const states = provider.awareness.getStates()
        const users = Array.from(states.entries())
          .filter(([clientId]) => clientId !== provider.awareness.clientID)
          .map(([clientId, state]: [number, any]) => ({
            id: `client_${clientId}`, // 使用唯一的 clientID 作为 key
            userId: state.user?.id,   // 真实的用户ID
            name: state.user?.name || '匿名用户',
            color: state.user?.color || '#888888',
            cursor: state.cursor,
            selection: state.selection,
          }))
        setUsers(users)
      })
    }

    initCollaboration()

    // 清理
    return () => {
      mounted = false
      if (bindingRef.current) {
        bindingRef.current.destroy()
      }
      if (providerRef.current) {
        destroyProvider(providerRef.current, indexeddbProviderRef.current || undefined)
      }
    }
  }, [roomId, user, setYDoc, setConnectionStatus, setCurrentUser, setUsers])

  // 绑定 Monaco Editor 和 Yjs
  const handleEditorDidMount = async (editor: Monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor
    
    if (yDocRef.current && providerRef.current && activeFile) {
      const yText = yDocRef.current.getText(activeFile)
      try {
        const currentContent = useEditorStore.getState().files[activeFile] || ''
        if (yText.toString().length === 0 && currentContent) {
          yText.insert(0, currentContent)
        }
      } catch {}
      bindingRef.current = await createMonacoBinding(yText, editor, providerRef.current)
      
      // 同步光标
      syncCursorToAwareness(editor, providerRef.current)
    }
  }

  // 监听 activeFile 变化，重新绑定
  useEffect(() => {
    const editor = editorRef.current
    if (!editor || !yDocRef.current || !providerRef.current || !activeFile) return

    // 销毁旧绑定
    if (bindingRef.current) {
      bindingRef.current.destroy()
    }

    const bindNewFile = async () => {
      if (!yDocRef.current || !providerRef.current || !activeFile) return
      
      const yText = yDocRef.current.getText(activeFile)
      
      // 初始化内容逻辑
      try {
        const currentContent = useEditorStore.getState().files[activeFile] || ''
        if (yText.toString().length === 0 && currentContent) {
          yText.insert(0, currentContent)
        }
      } catch {}

      bindingRef.current = await createMonacoBinding(yText, editor, providerRef.current)
      syncCursorToAwareness(editor, providerRef.current)
    }

    bindNewFile()

    return () => {
      if (bindingRef.current) {
        bindingRef.current.destroy()
        bindingRef.current = null
      }
    }
  }, [activeFile])

  if (!activeFile) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-gray-500">
        <div className="flex flex-col items-center gap-2">
          <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>请选择或创建一个文件</span>
        </div>
      </div>
    )
  }

  if (!isReady) {
    return <Loading text="正在同步协同数据..." />
  }

  const language = getLanguageFromPath(activeFile)

  return (
      <MonacoEditor
        height="100%"
        defaultLanguage="javascript"
        language={language}
        theme="vs-dark"
        loading={<Loading text="正在初始化编辑器核心..." />}
        options={{
          minimap: { enabled: false },
          fontSize: 14,
          fontFamily: "'Fira Code', 'JetBrains Mono', Consolas, monospace",
          fontLigatures: true,
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          cursorBlinking: 'smooth',
          cursorSmoothCaretAnimation: 'on',
          smoothScrolling: true,
          formatOnPaste: true,
          formatOnType: true,
        }}
        onMount={handleEditorDidMount}
      />
  )
}

