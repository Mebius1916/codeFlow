import * as Y from 'yjs'
import { ObservableV2 } from 'lib0/observable'
import * as awarenessProtocol from 'y-protocols/awareness'

export type AwarenessProvider = {
  awareness: awarenessProtocol.Awareness
}

export class YjsWorkerProvider extends ObservableV2<any> {
  public awareness: awarenessProtocol.Awareness
  public connected = false
  private worker: Worker

  constructor(worker: Worker, doc: Y.Doc) {
    super()
    this.worker = worker
    this.awareness = new awarenessProtocol.Awareness(doc)
    
    this.worker.addEventListener('message', (e) => {
      const { type, payload } = e.data
      if (type === 'awareness-update') {
        awarenessProtocol.applyAwarenessUpdate(
          this.awareness,
          payload as Uint8Array,
          'worker'
        )
      }
      if (type === 'status') {
        this.connected = payload === 'connected'
        this.emit('status', [{ status: payload }])
      }
      if (type === 'update') {
        Y.applyUpdate(doc, payload as Uint8Array, 'worker')
      }
    })

    doc.on('update', (update: Uint8Array, origin: any) => {
      if (origin !== 'worker') {
        this.worker.postMessage({
          type: 'update',
          payload: update
        })
      }
    })

    this.awareness.on('update', ({ added, updated, removed }: any, origin: any) => {
      if (origin === 'worker') return
      
      const awarenessUpdate = awarenessProtocol.encodeAwarenessUpdate(
        this.awareness,
        added.concat(updated).concat(removed)
      )
      
      this.worker.postMessage({
        type: 'awareness-update',
        payload: awarenessUpdate
      })
    })
  }

  connect() {
    this.connected = true
    this.emit('status', [{ status: 'connected' }])
  }

  disconnect() {
    this.connected = false
    this.emit('status', [{ status: 'disconnected' }])
  }

  destroy() {
    this.disconnect()
    this.awareness.destroy()
  }
}
