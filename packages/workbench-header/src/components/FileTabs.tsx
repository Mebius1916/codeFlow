import { FileIcon } from '@collaborative-editor/file-tree'
import type { MouseEvent } from 'react'
import { splitFileName } from '../utils/splitFileName'

export type FileTabsProps = {
  activeFile: string | null
  openFiles: string[]
  onOpenFile: (path: string) => void
  onCloseFile: (path: string) => void
}

export function FileTabs({ activeFile, openFiles, onOpenFile, onCloseFile }: FileTabsProps) {
  return (
    <div
      className="flex-1 flex items-center overflow-x-auto overflow-y-hidden h-full px-0 bg-[rgb(19,22,32)] [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-[#2a2f4c]/30 hover:[&::-webkit-scrollbar-thumb]:bg-[#2a2f4c]/70 [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-transparent [&::-webkit-scrollbar-thumb]:bg-clip-padding [&::-webkit-scrollbar-thumb]:transition-colors"
      style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(42, 47, 76, 0.7) transparent' }}
    >
      {openFiles.map((file) => {
        const baseName = file.split('/').pop() || file
        const { stem, ext } = splitFileName(baseName)
        return (
          <div
            key={file}
            onClick={() => onOpenFile(file)}
            className={`
              flex items-center gap-2 px-3 h-full cursor-pointer text-sm transition-all border-t-0 border-b-0 min-w-0 max-w-[240px] overflow-hidden
              ${activeFile === file
                ? 'bg-[#15172A] border-[#2a2f4c] text-white border-t-2 border-t-blue-500'
                : 'bg-transparent border-[#2a2f4c] text-[#6B7280] hover:bg-[#252526]/50 hover:text-gray-400 border-t-2 border-t-transparent'
              }
            `}
          >
            <FileIcon name={file} isFolder={false} />
            <span className="min-w-0 flex-1 flex items-center overflow-hidden">
              <span className="min-w-0 truncate">{stem}</span>
              {ext && <span className="shrink-0">{ext}</span>}
            </span>
            <button
              onClick={(e: MouseEvent<HTMLButtonElement>) => {
                e.stopPropagation()
                onCloseFile(file)
              }}
              className="shrink-0 hover:text-white"
            >
              ×
            </button>
          </div>
        )
      })}
    </div>
  )
}
