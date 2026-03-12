import * as Y from 'yjs'
import type { SnapshotContent } from '../types'

export const getBinaryMap = (doc: Y.Doc) => doc.getMap<Uint8Array>('binary')

// yjs doc 初始化
export const applySnapshotToDoc = (
  doc: Y.Doc,
  snapshot: Record<string, SnapshotContent>,
  origin: string = 'local-forage',
) => {
  const binaryMap = getBinaryMap(doc)
  doc.transact(() => {
    for (const [path, content] of Object.entries(snapshot)) {
      if (typeof content === 'string') {
        const yText = doc.getText(path)
        const current = yText.toString()
        if (current !== content) {
          if (yText.length > 0) {
            yText.delete(0, yText.length)
          }
          yText.insert(0, content)
        }
      } else if (content instanceof Uint8Array) {
        console.log('[YjsLocalForage] applySnapshotToDoc', { path, content })
        binaryMap.set(path, content)
      }
    }
  }, origin)
}

export const extractSnapshotFromDoc = (doc: Y.Doc): Record<string, SnapshotContent> => {
  const snapshot: Record<string, SnapshotContent> = {}

  doc.share.forEach((type, key) => {
    if (type instanceof Y.Text) {
      snapshot[key] = type.toString()
    }
  })

  const binaryMap = getBinaryMap(doc)
  binaryMap.forEach((value, key) => {
    if (value instanceof Uint8Array) {
      snapshot[key] = value
    }
  })

  return snapshot
}
