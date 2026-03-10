import { getSnapshot, setSnapshot } from '@collaborative-editor/yjs-local-forage'

export type PreviewContentSize = { width: number; height: number }

export async function getCachedPreviewSize(roomId: string) {
  const snapshot = await getSnapshot(`preview-size:${roomId}`, 'cache-preview')
  const size = snapshot?.size
  if (typeof size !== 'string') return undefined
  return JSON.parse(size) as PreviewContentSize
}

export function setCachedPreviewSize(roomId: string, size: PreviewContentSize) {
  void setSnapshot(`preview-size:${roomId}`, { size: JSON.stringify(size) }, 'cache-preview')
}

