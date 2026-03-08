import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { useShallow } from 'zustand/react/shallow'
import { useCollaborationStore } from '../store/collaboration-store'
import { type CodeEditorUser } from '@collaborative-editor/shared'
import { YjsWorkerProvider } from '../lib/yjs/provider'
import { getSnapshot } from '@collaborative-editor/yjs-local-forage'
// @ts-ignore
import YjsWorker from '../lib/yjs/worker.ts?worker'

export function useYjsCollaboration({
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
  initialFiles?: Record<string, string>
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

    const start = async () => {
      const snapshot = await getSnapshot(roomId)
      const shouldSyncPath = (path: string) => !path.startsWith('assets/images/') && !path.startsWith('assets/icons/')

      const filterSeed = (source: Record<string, string>) =>
        Object.fromEntries(
          Object.entries(source).filter(
            ([path, value]) =>
              shouldSyncPath(path)
          ),
        ) as Record<string, string>

      const seedFiles = snapshot ? filterSeed(snapshot as Record<string, string>) : undefined
    
      worker.postMessage({
        type: 'init',
        payload: {
          roomId,
          wsUrl,
          userId: user.id,
          userName: user.name,
          userColor: user.color,
          enablePersistence,
          initialFiles: seedFiles,
        }
      })
    }

    start()

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

    newProvider.on('status', ({ status }: { status: 'connected' | 'disconnected' | 'connecting' }) => {
      setConnectionStatus(status === 'connected' ? 'connected' : status === 'connecting' ? 'connecting' : 'disconnected')
    })

    return () => {
      mounted = false
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
