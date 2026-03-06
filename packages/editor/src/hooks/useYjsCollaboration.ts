import { useEffect, useRef, useState } from 'react'
import type { WebsocketProvider } from 'y-websocket'
import type { IndexeddbPersistence } from 'y-indexeddb'
import type * as Y from 'yjs'
import { useCollaborationStore } from '../store/collaboration-store'
import { createYjsProvider, destroyProvider } from '../lib/yjs'
import type { CodeEditorUser } from '@collaborative-editor/shared'

export function useYjsCollaboration({
  roomId,
  user,
  wsUrl,
}: {
  roomId: string
  user: CodeEditorUser
  wsUrl?: string
}) {
  const [isReady, setIsReady] = useState(false)
  const providerRef = useRef<WebsocketProvider | null>(null)
  const indexeddbProviderRef = useRef<IndexeddbPersistence | null>(null)
  const yDocRef = useRef<Y.Doc | null>(null)

  const { setYDoc, setConnectionStatus, setCurrentUser, setUsers } = useCollaborationStore()

  useEffect(() => {
    let mounted = true

    const initCollaboration = async () => {
      try {
        setConnectionStatus('connecting')
        const { yDoc, provider, indexeddbProvider } = await createYjsProvider({
          roomId,
          wsUrl,
          userId: user.id,
          userName: user.name,
          userColor: user.color,
        })

        if (!mounted) return

        providerRef.current = provider
        indexeddbProviderRef.current = indexeddbProvider
        yDocRef.current = yDoc as any
        setYDoc(yDoc)

        setCurrentUser({
          id: user.id,
          name: user.name || 'Anonymous',
          color: user.color || '',
        })

        const updateUsers = () => {
          const states = Array.from(provider.awareness.getStates().values())
          const users = states.map((state: any) => state.user).filter(Boolean)
          setUsers(users)
        }

        provider.awareness.on('change', updateUsers)
        updateUsers()

        provider.on('status', ({ status }: { status: 'connected' | 'disconnected' | 'connecting' }) => {
          setConnectionStatus(status === 'connected' ? 'connected' : status === 'connecting' ? 'connecting' : 'disconnected')
        })

        setIsReady(true)
      } catch {
        setConnectionStatus('disconnected')
      }
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
