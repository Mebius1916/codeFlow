import { useCallback, useEffect, useRef, type RefObject } from 'react'

type Size = { width: number; height: number } | null

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

export function PreviewExportButton({
  targetSize,
  disabled,
  iframeRef,
}: {
  targetSize: Size
  disabled?: boolean
  iframeRef: RefObject<HTMLIFrameElement | null>
}) {
  const isDisabled = disabled || !targetSize
  const capturingRef = useRef(false)

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const data = event.data
      if (!data || typeof data !== 'object') return
      if (event.source !== iframeRef.current?.contentWindow) return

      if (data.type === 'preview:capture:done') {
        capturingRef.current = false
        const buffer: ArrayBuffer = data.payload?.buffer
        if (!buffer) return
        const blob = new Blob([buffer], { type: 'image/png' })
        triggerDownload(blob, `preview-${Date.now()}.png`)
      }

      if (data.type === 'preview:capture:error') {
        capturingRef.current = false
        console.error('[Preview][Export]', data.payload?.message)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [iframeRef])

  const handleExport = useCallback(() => {
    if (!targetSize || capturingRef.current) return
    const win = iframeRef.current?.contentWindow
    if (!win) return
    capturingRef.current = true
    win.postMessage(
      { type: 'preview:capture', payload: { width: targetSize.width, height: targetSize.height } },
      '*',
    )
  }, [targetSize, iframeRef])

  return (
    <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
      <button
        type="button"
        disabled={isDisabled}
        onClick={handleExport}
        className="h-8 px-2 rounded-md border border-[#2a2f4c] bg-[#15182A]/70 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        title={targetSize ? `导出渲染截图（${targetSize.width}×${targetSize.height}）` : '导出渲染截图'}
      >
        <span className="text-[11px] font-medium text-white/80">导出</span>
      </button>
    </div>
  )
}
