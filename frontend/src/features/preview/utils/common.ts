export function blobToBase64Png(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error)
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : ''
      resolve(dataUrl.replace(/^data:image\/png;base64,/, ''))
    }
    reader.readAsDataURL(blob)
  })
}

export function computeLayoutPayload(
  previewContentSize: { width: number; height: number } | null | undefined,
  containerSize: { width: number; height: number },
) {
  if (!previewContentSize) return null

  const contentWidth = previewContentSize.width
  const contentHeight = previewContentSize.height
  const containerWidth = containerSize.width
  const containerHeight = containerSize.height

  if (contentWidth <= 0 || contentHeight <= 0) return null
  if (containerWidth <= 0 || containerHeight <= 0) return null

  const scale = Math.min(containerWidth / contentWidth, containerHeight / contentHeight)
  return { scale, width: contentWidth, height: contentHeight }
}

export function computeCaptureTargetSize(
  previewContentSize: { width: number; height: number } | null | undefined,
  containerSize: { width: number; height: number },
) {
  if (previewContentSize?.width && previewContentSize?.height) {
    return { width: Math.round(previewContentSize.width), height: Math.round(previewContentSize.height) }
  }
  if (containerSize.width && containerSize.height) {
    return { width: Math.round(containerSize.width), height: Math.round(containerSize.height) }
  }
  return null
}
