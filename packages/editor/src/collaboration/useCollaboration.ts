import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { WebsocketProvider } from 'y-websocket'
import { YjsLocalForageProvider } from '@collaborative-editor/yjs-local-forage'
import { type CodeEditorUser, useEditorStore } from '@collaborative-editor/shared'
import { bindAnyStoreSync } from './anyStoreSync'
import { setAny } from './yjsAny'
import type { Awareness } from 'y-protocols/awareness'
import { getUserColor } from './userColor'

type AwarenessProvider = {
  awareness: Awareness
}

export function useCollaboration({
  roomId,
  user,
  wsUrl,
  collaborationEnabled,
}: {
  roomId: string
  user: CodeEditorUser
  wsUrl?: string
  collaborationEnabled?: boolean
}) {
  const [isReady, setIsReady] = useState(false)
  const [provider, setProvider] = useState<AwarenessProvider | null>(null)
  const yDocRef = useRef<Y.Doc | null>(null)
  const wsProviderRef = useRef<WebsocketProvider | null>(null)
  const persistenceProviderRef = useRef<YjsLocalForageProvider | null>(null)

  useEffect(() => {
    if (!collaborationEnabled) {
      setProvider(null)
      yDocRef.current = null
      setIsReady(true)
      return
    }

    setIsReady(false)
    const yDoc = new Y.Doc()
    yDocRef.current = yDoc
    const url = wsUrl || 'ws://localhost:1234'
    const wsProvider = new WebsocketProvider(url, roomId, yDoc, { connect: true })
    wsProviderRef.current = wsProvider
    persistenceProviderRef.current = new YjsLocalForageProvider(roomId, yDoc)
    setProvider({ awareness: wsProvider.awareness })

    const unsubscribeDocSync = bindAnyStoreSync(yDoc)

    wsProvider.awareness.setLocalStateField('user', {
      id: user.id,
      name: user.name || 'Anonymous',
      color: user.color || getUserColor(user.id),
    })

    let cancelled = false
    const init = async () => {
      await persistenceProviderRef.current?.init()
      if (cancelled) return
      const files = useEditorStore.getState().files
      Object.entries(files).forEach(([path, content]) => {
        if (typeof content !== 'string' && !(content instanceof Uint8Array)) return
        setAny(yDoc, path, content)
      })
      setIsReady(true)
    }
    init().catch(() => {
      if (!cancelled) setIsReady(true)
    })

    return () => {
      cancelled = true
      unsubscribeDocSync()
      wsProvider.destroy()
      persistenceProviderRef.current?.destroy()
      wsProviderRef.current = null
      persistenceProviderRef.current = null
      yDoc.destroy()
    }
  }, [roomId, collaborationEnabled, user.id, user.name, user.color, wsUrl])

  return { isReady, provider, yDoc: yDocRef.current }
}
