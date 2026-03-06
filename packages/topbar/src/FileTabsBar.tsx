import { FileIcon } from '@collaborative-editor/file-tree'

export type FileTabsBarProps = {
  activeFile: string | null
  openFiles: string[]
  onOpenFile: (path: string) => void
  onCloseFile: (path: string) => void
}

export function FileTabsBar({ activeFile, openFiles, onOpenFile, onCloseFile }: FileTabsBarProps) {
  return (
    <div className="flex-1 flex items-center overflow-x-auto h-full px-0">
      {openFiles.map((file) => (
        <div
          key={file}
          onClick={() => onOpenFile(file)}
          className={`
            flex items-center gap-2 px-3 h-full cursor-pointer text-sm transition-all  border-t-0 border-b-0 min-w-fit
            ${activeFile === file
              ? 'bg-[#15172A] border-[#2a2f4c] text-white border-t-2 border-t-blue-500'
              : 'bg-transparent border-[#2a2f4c] text-[#6B7280] hover:bg-[#1e1e1e]/50 hover:text-gray-400 border-t-2 border-t-transparent'
            }
          `}
        >
          <FileIcon name={file} isFolder={false} />
          <span>{file.split('/').pop()}</span>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onCloseFile(file)
            }}
            className="hover:text-white"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  )
}

