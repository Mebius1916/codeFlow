import { zipSync, strToU8 } from 'fflate'

interface DownloadAllFilesOptions {
  files: Record<string, string>
  fileKeys: string[]
  zipName?: string
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
    if (typeof content !== 'string') return
    entries[path] = strToU8(content)
  })

  const zipped = zipSync(entries, { level: 0 })
  const blob = new Blob([new Uint8Array(zipped)], { type: 'application/zip' })
  triggerDownload(blob, zipName || 'downloadAll.zip')
}
