interface FileTreeHeaderProps {
  withRightBorder?: boolean
  onNewFile: () => void
  onNewFolder: () => void
}

export function FileTreeHeader({ withRightBorder, onNewFile, onNewFolder }: FileTreeHeaderProps) {
  return (
    <div
      className={`h-full w-full flex items-center justify-between px-4 ${withRightBorder ? 'border-r' : ''}`}
      style={{
        backgroundColor: 'rgb(15, 17, 25)',
        borderRightColor: withRightBorder ? 'var(--file-tree-border-color, #2a2f4c)' : undefined,
      }}
    >
      <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">资源管理器</h3>
      <div className="flex items-center gap-1">
        <button
          onClick={onNewFile}
          className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          title="新建文件"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          onClick={onNewFolder}
          className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          title="新建文件夹"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
        </button>
      </div>
    </div>
  )
}

