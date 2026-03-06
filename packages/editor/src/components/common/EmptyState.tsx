export function EmptyState() {
  return (
    <div className="flex items-center justify-center h-full text-gray-500" style={{ backgroundColor: 'rgb(21, 23, 42)' }}>
      <div className="flex flex-col items-center gap-2">
        <svg className="w-12 h-12 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <span>请选择或创建一个文件</span>
      </div>
    </div>
  )
}

