'use client'

import { useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import type * as Monaco from 'monaco-editor'
import type { WebsocketProvider } from 'y-websocket'
import * as Y from 'yjs'
import { useEditorStore, useCollaborationStore } from '../../lib/store'
import { getLanguageFromPath } from '../../lib/utils/file'
import { createYjsProvider, destroyProvider, createMonacoBinding, syncCursorToAwareness } from '../../lib/yjs'
import type { CodeEditorProps } from './types'
import { UserCursors } from './UserCursors'

const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center justify-center h-full bg-[#1e1e1e] text-gray-400 gap-3">
      <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      <span className="text-sm font-medium animate-pulse">正在初始化编辑器...</span>
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
      // 若协同文本为空，但本地已有初始内容，则先写入到 Yjs，避免绑定后清空
      // 注意：仅当文档完全为空时才写入初始内容，避免重复追加
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

  if (!activeFile) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-[#1e1e1e] text-gray-500">
        <div className="w-16 h-16 mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
          <svg className="w-8 h-8 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-300 mb-2">准备就绪</h3>
        <p className="text-sm max-w-xs text-center text-gray-500">请选择或创建一个文件开始编写代码，体验实时协同功能。</p>
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

