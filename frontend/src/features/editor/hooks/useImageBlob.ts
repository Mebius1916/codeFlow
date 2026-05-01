import { useState, useEffect } from 'react'
import { ensureUint8Array } from '@/utils/buffer'
const mimeByExt: Record<string, string> = {
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
}

const getMime = (fileName?: string) => {
  if (!fileName) return undefined
  const ext = fileName.split('.').pop()?.toLowerCase()
  if (!ext) return undefined
  return mimeByExt[ext]
}

export function useImageBlob(content: Uint8Array | string | null, fileName?: string) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  useEffect(() => {
    if (content === null) {
      setBlobUrl(null)
      return
    }

    const safeContent = ensureUint8Array(content)

    const mime = getMime(fileName)
    const blob = new Blob([safeContent as BlobPart], mime ? { type: mime } : undefined)
    const url = URL.createObjectURL(blob)

    setBlobUrl(url)

    return () => {
      URL.revokeObjectURL(url)
    }
  }, [content, fileName])

  return blobUrl
}
