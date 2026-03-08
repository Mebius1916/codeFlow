export const Loading = ({
  text = '正在初始化编辑器...',
  detail,
  className = 'bg-[#15172A] text-gray-400',
}: {
  text?: string
  detail?: string
  className?: string
}) => (
  <div className={`flex flex-col items-center justify-center h-full ${className} gap-3`}>
    <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-medium animate-pulse">{text}</span>
    {detail ? (
      <div className="text-[10px] font-mono text-gray-600 max-w-[200px] truncate">{detail}</div>
    ) : null}
  </div>
)
