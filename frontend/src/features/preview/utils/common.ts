import type { RectSize } from '../interfaces/contracts'

export function computeLayoutPayload(
  previewContentSize: RectSize | null | undefined,
  containerSize: RectSize,
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
