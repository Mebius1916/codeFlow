export function buildAssetPathFromContentType(key: string, contentType: string) {
  const normalized = contentType.toLowerCase()
  const ext =
    normalized.includes('image/svg+xml') ? 'svg'
    : normalized.includes('image/jpeg') ? 'jpg'
    : normalized.includes('image/png') ? 'png'
    : 'png'

  const filename = `${key}.${ext}`
  const relativePath = `assets/${filename}`
  return { relativePath, filename }
}

