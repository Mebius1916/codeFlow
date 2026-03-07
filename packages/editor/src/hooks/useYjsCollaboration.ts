import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import { useShallow } from 'zustand/react/shallow'
import { useCollaborationStore } from '../store/collaboration-store'
import { useEditorStore, type CodeEditorUser } from '@collaborative-editor/shared'
import { YjsWorkerProvider } from '../lib/yjs/provider'
import { getSnapshot } from '@collaborative-editor/yjs-local-forage'
// @ts-ignore
import YjsWorker from '../lib/yjs/worker.ts?worker'

export function useYjsCollaboration({
  roomId,
  user,
  wsUrl,
  enablePersistence,
}: {
  roomId: string
  user: CodeEditorUser
  wsUrl?: string
  enablePersistence?: boolean
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
    
    const yDoc = new Y.Doc()
    yDocRef.current = yDoc
    setYDoc(yDoc)

    const worker = new YjsWorker()
    workerRef.current = worker

    // Create bridge provider
    const newProvider = new YjsWorkerProvider(worker, yDoc)
    setProvider(newProvider)

    setConnectionStatus('connecting')

    // 🚀 Try to load snapshot immediately for optimistic UI
    getSnapshot(roomId).then((snapshot) => {
      if (snapshot && mounted && Object.keys(snapshot).length > 0) {
        console.log(`[Editor] 📸 Loaded snapshot with ${Object.keys(snapshot).length} files`)
        useEditorStore.getState().initializeFiles(snapshot)
      }
    })

    // Initialize Worker
    worker.postMessage({
      type: 'init',
      payload: {
        roomId,
        wsUrl,
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        enablePersistence,
      }
    })

    // Listen for ready signal
    worker.addEventListener('message', (e: MessageEvent) => {
      if (e.data.type === 'ready') {
        console.log('[Editor] 🚀 Worker is Ready')
        if (mounted) setIsReady(true)
      }
    })

    setCurrentUser({
      id: user.id,
      name: user.name || 'Anonymous',
      color: user.color || '',
    })

    // Sync users from awareness
    const updateUsers = () => {
      const states = Array.from(newProvider.awareness.getStates().values())
      const users = states.map((state: any) => state.user).filter(Boolean)
      setUsers(users)
    }

    newProvider.awareness.on('change', updateUsers)
    updateUsers() // Initial sync
    
    // Sync connection status
    newProvider.on('status', ({ status }: { status: 'connected' | 'disconnected' | 'connecting' }) => {
      setConnectionStatus(status === 'connected' ? 'connected' : status === 'connecting' ? 'connecting' : 'disconnected')
    })

    return () => {
      mounted = false
      worker.postMessage({ type: 'destroy' })
      worker.terminate()
      newProvider.destroy()
      yDoc.destroy()
      
      workerRef.current = null
      setProvider(null)
      yDocRef.current = null
    }
  }, [roomId, user.id, user.name, user.color, wsUrl, enablePersistence, setYDoc, setConnectionStatus, setCurrentUser, setUsers])

  return { isReady, provider, yDocRef }
}
