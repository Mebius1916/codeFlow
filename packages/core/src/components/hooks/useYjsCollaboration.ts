import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import type { WebsocketProvider } from 'y-websocket'
import type { IndexeddbPersistence } from 'y-indexeddb'
import { useCollaborationStore } from '../../lib/store'
import { createYjsProvider, destroyProvider } from '../../lib/yjs'

interface UseYjsCollaborationProps {
  roomId: string
  user: {
    id: string
    name?: string
    color?: string
  }
  wsUrl?: string
}

export function useYjsCollaboration({ roomId, user, wsUrl }: UseYjsCollaborationProps) {
  const { setYDoc, setConnectionStatus, setCurrentUser, setUsers } = useCollaborationStore()
  const [isReady, setIsReady] = useState(false)
  
  const providerRef = useRef<WebsocketProvider | null>(null)
  const yDocRef = useRef<Y.Doc | null>(null)
  const indexeddbProviderRef = useRef<IndexeddbPersistence | null>(null)

  useEffect(() => {
    if (!roomId) return

    let mounted = true

    const initCollaboration = async () => {
      const userId = user.id
      const userName = user.name || `用户${Math.floor(Math.random() * 1000)}`
      const userColor = user.color || '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
      const websocketUrl = wsUrl || 'ws://localhost:1234'

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

      setCurrentUser({
        id: userId,
        name: userName,
        color: userColor,
      })

      provider.on('status', ({ status }: { status: string }) => {
        const connectionStatus = status === 'connected' ? 'connected' : 
                                status === 'connecting' ? 'connecting' : 'disconnected'
        setConnectionStatus(connectionStatus)
      })

      provider.awareness.on('change', () => {
        const states = provider.awareness.getStates()
        const users = Array.from(states.entries())
          .filter(([clientId]) => clientId !== provider.awareness.clientID)
          .map(([clientId, state]: [number, any]) => ({
            id: `client_${clientId}`,
            userId: state.user?.id,
            name: state.user?.name || '匿名用户',
            color: state.user?.color || '#888888',
            cursor: state.cursor,
            selection: state.selection,
          }))
        setUsers(users)
      })
    }

    initCollaboration()

    return () => {
      mounted = false
      if (providerRef.current) {
        destroyProvider(providerRef.current, indexeddbProviderRef.current || undefined)
      }
    }
  }, [roomId, user.id, user.name, user.color, wsUrl, setYDoc, setConnectionStatus, setCurrentUser, setUsers])

  return { isReady, providerRef, yDocRef }
}
