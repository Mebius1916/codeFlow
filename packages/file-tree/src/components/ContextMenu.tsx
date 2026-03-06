import { useEffect } from 'react'

interface ContextMenuProps {
  x: number
  y: number
  path: string | null
  type: 'file' | 'folder'
  onClose: () => void
  onNewFile: () => void
  onNewFolder: () => void
  onDelete: () => void
  onRename: () => void
}

export const ContextMenu = ({
  x,
  y,
  path,
  type,
  onClose,
  onNewFile,
  onNewFolder,
  onDelete,
  onRename,
}: ContextMenuProps) => {
  useEffect(() => {
    const handleClick = () => onClose()
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [onClose])

  return (
    <div
      className="fixed z-50 bg-[#252526] border border-[#454545] shadow-lg rounded py-1 min-w-[160px]"
      style={{ top: y, left: x }}
      onClick={(e) => e.stopPropagation()}
    >
      {type === 'folder' && (
        <>
          <button
            className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-[#094771] hover:text-white flex items-center gap-2"
            onClick={() => {
              onNewFile()
              onClose()
            }}
          >
            新建文件
          </button>
          <button
            className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-[#094771] hover:text-white flex items-center gap-2"
            onClick={() => {
              onNewFolder()
              onClose()
            }}
          >
            新建文件夹
          </button>
        </>
      )}

      {path && (
        <>
          {type === 'folder' && <div className="h-px bg-[#454545] my-1 mx-2" />}
          <button
            className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-[#094771] hover:text-white flex items-center gap-2"
            onClick={() => {
              onRename()
              onClose()
            }}
          >
            重命名...
          </button>
          <button
            className="w-full text-left px-3 py-1.5 text-sm text-gray-300 hover:bg-[#094771] hover:text-white flex items-center gap-2"
            onClick={() => {
              onDelete()
              onClose()
            }}
          >
            删除
          </button>
        </>
      )}
    </div>
  )
}

