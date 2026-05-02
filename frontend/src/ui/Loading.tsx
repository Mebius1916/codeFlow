type LoadingVariant = 'loading' | 'error'

interface LoadingProps {
  text?: string
  detail?: string
  variant?: LoadingVariant
  className?: string
}

export const Loading = ({ text = '正在初始化编辑器...', detail, variant = 'loading', className }: LoadingProps) => {
  const baseClassName = 'flex flex-col items-center justify-center h-full w-full gap-3'

  if (variant === 'error') {
    const containerClassName = `${baseClassName} ${className ?? 'bg-[#15172A] text-red-400'}`
    return (
      <div className={containerClassName}>
        <div className="text-2xl">⚠️</div>
        <span className="text-xs font-medium animate-pulse">{text}</span>
        {detail ? <div className="text-xs font-mono bg-black/30 p-2 rounded max-w-full overflow-auto">{detail}</div> : null}
      </div>
    )
  }

  const containerClassName = `${baseClassName} ${className ?? 'bg-[#15172A] text-gray-400'}`
  return (
    <div className={containerClassName}>
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-medium animate-pulse">{text}</span>
      {detail ? <div className="text-[10px] font-mono text-gray-600 max-w-[200px] truncate">{detail}</div> : null}
    </div>
  )
}
