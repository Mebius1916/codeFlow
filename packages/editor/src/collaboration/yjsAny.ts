import * as Y from 'yjs'
import { anyEqual } from './anyEqual'

export type YjsAnyContent = string | Uint8Array

const getBinaryMap = (doc: Y.Doc) => doc.getMap<Uint8Array>('binary')
const getAnyText = (doc: Y.Doc, path: string) => doc.getText(path)

export const getAny = (doc: Y.Doc, path: string): YjsAnyContent | undefined => {
  const binaryMap = getBinaryMap(doc)
  const binary = binaryMap.get(path)
  if (binary instanceof Uint8Array) return binary

  const type = doc.share.get(path)
  if (type instanceof Y.Text) return type.toString()

  return undefined
}

export const observeAny = (
  doc: Y.Doc,
  path: string,
  onChange: (value: YjsAnyContent | undefined) => void,
) => {
  const binaryMap = getBinaryMap(doc)
  const yText = getAnyText(doc, path)

  const emit = () => {
    onChange(getAny(doc, path))
  }

  const onBinary = (event: Y.YMapEvent<Uint8Array>) => {
    if (!event.keysChanged.has(path)) return
    emit()
  }

  const onText = () => {
    if (binaryMap.has(path)) return
    emit()
  }

  binaryMap.observe(onBinary)
  yText.observe(onText)
  emit()

  return () => {
    binaryMap.unobserve(onBinary)
    yText.unobserve(onText)
  }
}

export const setAny = (doc: Y.Doc, path: string, content: YjsAnyContent) => {
  const binaryMap = getBinaryMap(doc)
  if (typeof content === 'string') {
    const yText = doc.getText(path)
    const current = yText.toString()
    if (anyEqual(current, content)) return
    doc.transact(() => {
      if (yText.length > 0) {
        yText.delete(0, yText.length)
      }
      if (content.length > 0) {
        yText.insert(0, content)
      }
    })
    return
  }

  const existing = binaryMap.get(path)
  if (anyEqual(existing, content)) return
  binaryMap.set(path, content)
}

export const deleteAny = (doc: Y.Doc, path: string) => {
  const binaryMap = getBinaryMap(doc)
  if (binaryMap.has(path)) {
    binaryMap.delete(path)
  }
  const type = doc.share.get(path)
  if (type instanceof Y.Text) {
    const yText = doc.getText(path)
    if (yText.length > 0) {
      doc.transact(() => {
        yText.delete(0, yText.length)
      })
    }
  }
}
