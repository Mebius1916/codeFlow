import { useEffect, useRef, useState } from 'react'
import * as Y from 'yjs'
import * as awarenessProtocol from 'y-protocols/awareness'
import { type CodeEditorUser, useEditorStore } from '@collaborative-editor/shared'
import { bindAnyStoreSync } from './anyStoreSync'
import type { Awareness } from 'y-protocols/awareness'
import YjsWorker from './worker.ts?worker'
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
  const workerRef = useRef<Worker | null>(null)

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
    const awareness = new awarenessProtocol.Awareness(yDoc)
    const newProvider = { awareness }
    setProvider(newProvider)

    const unsubscribeDocSync = bindAnyStoreSync(yDoc)

    const worker = new YjsWorker()
    workerRef.current = worker
    const onWorkerMessage = (e: MessageEvent) => {
      const { type, payload } = e.data
      if (type === 'ready') {
        const files = useEditorStore.getState().files
        const binaryMap = yDoc.getMap<Uint8Array>('binary')
        Object.entries(files).forEach(([path, content]) => {
          if (content instanceof Uint8Array) {
            if (binaryMap.has(path)) return
            binaryMap.set(path, content)
            return
          }
          if (typeof content !== 'string') return
          if (binaryMap.has(path)) return

          const existing = yDoc.share.get(path)
          const existingText = existing?.toString?.() ?? ''
          if (existingText.length > 0) return

          const yText = yDoc.getText(path)
          if (yText.length > 0) return
          if (content.length === 0) return

          yDoc.transact(() => {
            yText.insert(0, content)
          })
        })
        setIsReady(true)
        return
      }
      if (type === 'update') {
        Y.applyUpdate(yDoc, payload as Uint8Array, 'worker')
        return
      }
      if (type === 'awareness-update') {
        awarenessProtocol.applyAwarenessUpdate(awareness, payload as Uint8Array, 'worker')
      }
    }
    worker.addEventListener('message', onWorkerMessage)

    const onDocUpdate = (update: Uint8Array, origin: any) => {
      if (origin === 'worker') return
      worker.postMessage({ type: 'update', payload: update })
    }
    yDoc.on('update', onDocUpdate)

    const onAwarenessUpdate = ({ added, updated, removed }: any, origin: any) => {
      if (origin === 'worker') return
      const update = awarenessProtocol.encodeAwarenessUpdate(awareness, added.concat(updated).concat(removed))
      worker.postMessage({ type: 'awareness-update', payload: update })
    }
    awareness.on('update', onAwarenessUpdate)

    awareness.setLocalStateField('user', {
      id: user.id,
      name: user.name || 'Anonymous',
      color: user.color || getUserColor(user.id),
    })

    worker.postMessage({
      type: 'init',
      payload: {
        roomId,
        wsUrl,
      }
    })

    return () => {
      worker.removeEventListener('message', onWorkerMessage)
      unsubscribeDocSync()
      awareness.off('update', onAwarenessUpdate)
      awareness.destroy()
      yDoc.off('update', onDocUpdate)
      yDoc.destroy()
      worker.terminate()
      workerRef.current = null
    }
  }, [roomId, collaborationEnabled, user.id, user.name, user.color, wsUrl])

  return { isReady, provider, yDoc: yDocRef.current }
}
