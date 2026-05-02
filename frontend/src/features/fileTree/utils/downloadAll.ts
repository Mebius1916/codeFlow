import { zipSync, strToU8 } from 'fflate'

type FileContent = string | Uint8Array

interface DownloadAllFilesOptions {
  files: Record<string, FileContent>
  fileKeys: string[]
  zipName?: string
}

function contentToU8(content: FileContent): Uint8Array {
  return typeof content === 'string' ? strToU8(content) : content
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

export function downloadAllFilesAsZip(args: DownloadAllFilesOptions) {
  const { files, fileKeys, zipName } = args
  const entries: Record<string, Uint8Array> = {}

  fileKeys.forEach((path) => {
    const content = files[path]
    if (!(typeof content === 'string' || content instanceof Uint8Array)) return
    entries[path] = contentToU8(content)
  })

  const zipped = zipSync(entries, { level: 0 })
  const blob = new Blob([new Uint8Array(zipped)], { type: 'application/zip' })
  triggerDownload(blob, zipName || 'downloadAll.zip')
}
