 type Size = { width: number; height: number } | null

export function PreviewExportButton({
  targetSize,
  disabled,
}: {
  targetSize: Size
  disabled?: boolean
}) {
  const isDisabled = disabled || !targetSize

  return (
    <div className="absolute top-3 right-3 z-20 flex items-center gap-2">
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => {
          console.info('[Preview][Export] 截图导出功能暂未启用')
        }}
        className="h-8 px-2 rounded-md border border-[#2a2f4c] bg-[#15182A]/70 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        title={targetSize ? `导出渲染截图（${targetSize.width}×${targetSize.height}）` : '导出渲染截图'}
      >
        <span className="text-[11px] font-medium text-white/80">导出</span>
      </button>
    </div>
  )
}
