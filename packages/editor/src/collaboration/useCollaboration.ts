import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { useShallow } from 'zustand/react/shallow'
import { useCollaborationStore } from '../store/collaboration-store'
import { type CodeEditorUser } from '@collaborative-editor/shared'
import { YjsWorkerProvider } from './provider'
import { bindAnyStoreSync } from './anyStoreSync'
// @ts-ignore
import YjsWorker from './worker.ts?worker'

export function useCollaboration({
  roomId,
  user,
  wsUrl,
  enablePersistence,
  initialFiles,
  collaborationEnabled,
}: {
  roomId: string
  user: CodeEditorUser
  wsUrl?: string
  enablePersistence?: boolean
  initialFiles?: Record<string, string | Uint8Array>
  collaborationEnabled?: boolean
}) {
  const [isReady, setIsReady] = useState(false)
  const [provider, setProvider] = useState<YjsWorkerProvider | null>(null)
  const yDocRef = useRef<Y.Doc | null>(null)
  const workerRef = useRef<Worker | null>(null)

  const { setYDoc, setConnectionStatus, setCurrentUser, setUsers } = useCollaborationStore(
    useShallow((state) => ({
      setYDoc: state.setYDoc,
      setConnectionStatus: state.setConnectionStatus,
      setCurrentUser: state.setCurrentUser,
      setUsers: state.setUsers,
    }))
  )

  useEffect(() => {
    let mounted = true

    if (!collaborationEnabled) {
      setProvider(null)
      yDocRef.current = null
      setYDoc(null)
      setConnectionStatus('disconnected')
      setIsReady(true)

      setCurrentUser({
        id: user.id,
        name: user.name || 'Anonymous',
        color: user.color || '',
      })

      return
    }

    setIsReady(false)
    setConnectionStatus('connecting')

    const yDoc = new Y.Doc()
    yDocRef.current = yDoc
    setYDoc(yDoc)

    const worker = new YjsWorker()
    workerRef.current = worker

    const newProvider = new YjsWorkerProvider(worker, yDoc)
    setProvider(newProvider)

    worker.postMessage({
      type: 'init',
      payload: {
        roomId,
        wsUrl,
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        enablePersistence,
        initialFiles, 
      }
    })

    worker.addEventListener('message', (e: MessageEvent) => {
      if (e.data.type === 'ready') {
        if (mounted) setIsReady(true)
      }
    })

    setCurrentUser({
      id: user.id,
      name: user.name || 'Anonymous',
      color: user.color || '',
    })

    const updateUsers = () => {
      const states = Array.from(newProvider.awareness.getStates().values())
      const users = states.map((state: any) => state.user).filter(Boolean)
      setUsers(users)
    }

    newProvider.awareness.on('change', updateUsers)
    updateUsers()

    const unsubscribeDocSync = bindAnyStoreSync(yDoc)

    newProvider.on('status', ({ status }: { status: 'connected' | 'disconnected' | 'connecting' }) => {
      setConnectionStatus(status === 'connected' ? 'connected' : status === 'connecting' ? 'connecting' : 'disconnected')
    })

    return () => {
      mounted = false
      unsubscribeDocSync()
      worker.postMessage({ type: 'destroy' })
      worker.terminate()
      newProvider.destroy()

      workerRef.current = null
      setProvider(null)
      yDocRef.current = null
      setYDoc(null)
    }
  }, [roomId, user.id, user.name, user.color, wsUrl, enablePersistence, initialFiles, collaborationEnabled, setYDoc, setConnectionStatus, setCurrentUser, setUsers])

  return { isReady, provider, yDocRef }
}
