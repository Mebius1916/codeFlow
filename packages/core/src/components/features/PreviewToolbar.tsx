interface PreviewToolbarProps {
  previewUrl: string | null
  onRefresh: () => void
}

export function PreviewToolbar({ previewUrl, onRefresh }: PreviewToolbarProps) {
  if (!previewUrl) return null

  return (
    <div className="h-8 bg-[#f3f4f6] border-b flex items-center px-2 gap-2">
      <button 
        onClick={onRefresh}
        className="p-1 hover:bg-gray-200 rounded text-gray-600"
        title="刷新"
      >
        🔄
      </button>
      <div className="flex-1 bg-white border rounded px-2 py-0.5 text-xs text-gray-500 truncate select-all">
        {previewUrl}
      </div>
      <a 
        href={previewUrl} 
        target="_blank" 
        rel="noopener noreferrer"
        className="p-1 hover:bg-gray-200 rounded text-gray-600"
        title="在新标签页打开"
      >
        ↗
      </a>
    </div>
  )
}
