'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import type * as Monaco from 'monaco-editor'
import type { WebsocketProvider } from 'y-websocket'
import * as Y from 'yjs'
import { useEditorStore, useCollaborationStore } from '@/lib/store'
import { getLanguageFromPath } from '@/lib/utils/file'
import { createYjsProvider, destroyProvider, createMonacoBinding, syncCursorToAwareness } from '@/lib/yjs'
import type { CodeEditorProps } from './types'
import { UserCursors } from './UserCursors'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-white">
      加载编辑器中...
    </div>
  ),
})

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
  const { activeFile, files } = useEditorStore()
  const { setYDoc, setConnectionStatus, setCurrentUser, setUsers } = useCollaborationStore()
  
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null)
  const providerRef = useRef<WebsocketProvider | null>(null)
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
      const websocketUrl = wsUrl || 
                          (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_WS_URL) || 
                          'ws://localhost:1234'

      // 创建 Provider
      const { yDoc, provider } = await createYjsProvider({
        roomId,
        userId,
        userName,
        userColor,
        wsUrl: websocketUrl,
      })

      if (!mounted) {
        destroyProvider(provider)
        return
      }

      yDocRef.current = yDoc
      providerRef.current = provider
      setYDoc(yDoc)

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
        destroyProvider(providerRef.current)
      }
    }
  }, [roomId, user, setYDoc, setConnectionStatus, setCurrentUser, setUsers])

  const handleEditorDidMount = async (editor: Monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor

    // 绑定 Monaco 和 Yjs
    if (yDocRef.current && providerRef.current && activeFile) {
      const yText = yDocRef.current.getText(activeFile)
      bindingRef.current = await createMonacoBinding(yText, editor, providerRef.current)
      
      // 同步光标
      syncCursorToAwareness(editor, providerRef.current)
    }
  }

  if (!activeFile) {
    return (
      <div className="flex items-center justify-center h-full bg-[#1e1e1e] text-gray-400">
        <div className="text-center">
          <p className="text-lg mb-2">欢迎使用协同代码编辑器</p>
          <p className="text-sm">请通过 initialFiles 属性传入代码文件</p>
        </div>
      </div>
    )
  }

  const content = files[activeFile] || ''
  const language = getLanguageFromPath(activeFile)

  return (
    <div className="relative h-full">
      <MonacoEditor
        height="100%"
        language={language}
        value={content}
        onMount={handleEditorDidMount}
        theme="vs-dark"
        options={{
          fontSize: 14,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: 'on',
        }}
      />
      <UserCursors />
    </div>
  )
}

