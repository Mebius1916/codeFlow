import type { MouseEvent as ReactMouseEvent } from 'react'
import type { TreeNode } from '../utils/file-tree'
import { NewFileItem } from './NewFileItem'
import { FileIcon } from './FileIcon'

const dropIcon = new URL('../../assets/Drop.svg', import.meta.url).toString()

interface FileTreeNodeProps {
  node: TreeNode
  depth: number
  activeFile: string | null
  creatingState: { parentPath: string | null; type: 'file' | 'folder' } | null
  renamingState: { path: string; type: 'file' | 'folder' } | null
  onFileClick: (path: string) => void
  onFolderToggle: (path: string) => void
  onContextMenu: (e: ReactMouseEvent, path: string | null, type: 'file' | 'folder') => void
  onConfirmCreate: (name: string) => void
  onCancelCreate: () => void
  onConfirmRename: (name: string) => void
  onCancelRename: () => void
}

export const FileTreeNode = ({
  node,
  depth,
  activeFile,
  creatingState,
  renamingState,
  onFileClick,
  onFolderToggle,
  onContextMenu,
  onConfirmCreate,
  onCancelCreate,
  onConfirmRename,
  onCancelRename,
}: FileTreeNodeProps) => {
  const isFolder = node.type === 'folder'
  const isActive = node.path === activeFile
  const paddingLeft = depth * 12 + (isFolder ? 10 : 20)

  const isCreatingHere = creatingState?.parentPath === node.path
  const isRenaming = renamingState?.path === node.path

  const handleClick = (e: ReactMouseEvent) => {
    e.stopPropagation()
    if (isFolder) {
      onFolderToggle(node.path)
    } else {
      onFileClick(node.path)
    }
  }

  const handleContextMenu = (e: ReactMouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // onContextMenu(e, node.path, node.type)
  }

  if (isRenaming) {
    return (
      <NewFileItem
        depth={depth}
        type={node.type}
        initialValue={node.name}
        onCommit={onConfirmRename}
        onCancel={onCancelRename}
      />
    )
  }

  return (
    <div>
      <div
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`
          flex items-center gap-1.5 py-1 cursor-pointer text-sm transition-colors select-none relative
          ${isActive
            ? 'bg-blue-500/10 text-blue-400 border-l-2 border-blue-500'
            : 'text-gray-400 hover:text-gray-300 hover:bg-white/5 border-l-2 border-transparent'
          }
        `}
        style={{ paddingLeft }}
      >
        {isFolder && (
          <img
            src={dropIcon}
            className={`w-3 h-3 transition-transform duration-200 ${node.isOpen ? '' : '-rotate-90'}`}
            alt="toggle"
          />
        )}
        <span className="opacity-70 flex-shrink-0 h-4 w-4 flex items-center justify-center">
          <FileIcon name={node.name} isFolder={isFolder} isOpen={node.isOpen} />
        </span>
        <span className="truncate">{node.name}</span>
      </div>

      {isFolder && node.isOpen && (
        <>
          {isCreatingHere && creatingState && (
            <NewFileItem
              depth={depth + 1}
              type={creatingState.type}
              onCommit={onConfirmCreate}
              onCancel={onCancelCreate}
            />
          )}
          {node.children?.map((child: TreeNode) => (
            <FileTreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              activeFile={activeFile}
              creatingState={creatingState}
              renamingState={renamingState}
              onFileClick={onFileClick}
              onFolderToggle={onFolderToggle}
              onContextMenu={onContextMenu}
              onConfirmCreate={onConfirmCreate}
              onCancelCreate={onCancelCreate}
              onConfirmRename={onConfirmRename}
              onCancelRename={onCancelRename}
            />
          ))}
        </>
      )}
    </div>
  )
}
