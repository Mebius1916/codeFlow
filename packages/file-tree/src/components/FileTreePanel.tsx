import { useEditorStore, useFeatures } from '@collaborative-editor/shared'
import { useFileTreeData, useFileTreeResizeCssVars, useFileTreeActions } from '../hooks'
import { FileTreeNode } from './FileTreeNode'
import type { TreeNode } from '../utils/file-tree'
import { NewFileItem } from './NewFileItem'
import { ContextMenu } from './ContextMenu'
import { FileTreeHeader } from './FileTreeHeader'

type FileTreeActions = ReturnType<typeof useFileTreeActions>

interface FileTreePanelProps {
  actions?: FileTreeActions
  showHeader?: boolean
}

export function FileTreePanel({ actions, showHeader }: FileTreePanelProps) {
  const { files, activeFile, openFile } = useEditorStore()
  const { fileTree: isEnabled, toolbar: isToolbarEnabled } = useFeatures()
  const { onMouseDown, onMouseEnter, onMouseLeave, handleStyle } = useFileTreeResizeCssVars()

  const { fileTree, handleFolderToggle } = useFileTreeData(files)

  const {
    contextMenu,
    creatingState,
    renamingState,
    handleContextMenu,
    closeContextMenu,
    handleStartCreate,
    handleConfirmCreate,
    handleCancelCreate,
    handleStartRename,
    handleConfirmRename,
    handleDelete,
    setRenamingState,
  } = actions ?? useFileTreeActions()

  if (isEnabled === false) {
    return null
  }

  const shouldShowHeader = showHeader ?? (isToolbarEnabled === false)

  return (
    <div className="flex h-full relative group" onContextMenu={(e) => handleContextMenu(e, null)}>
      <div className="h-full flex flex-col" style={{ width: '100%', backgroundColor: 'rgb(15, 17, 25)' }}>
        {shouldShowHeader && (
          <FileTreeHeader
            onNewFile={() => handleStartCreate(null, 'file')}
            onNewFolder={() => handleStartCreate(null, 'folder')}
          />
        )}

        <div className="flex-1 overflow-y-auto py-2">
          {creatingState?.parentPath === null && (
            <NewFileItem
              depth={0}
              type={creatingState.type}
              onCommit={handleConfirmCreate}
              onCancel={handleCancelCreate}
            />
          )}

          {fileTree.map((node: TreeNode) => (
            <FileTreeNode
              key={node.id}
              node={node}
              depth={0}
              activeFile={activeFile}
              creatingState={creatingState}
              renamingState={renamingState}
              onFileClick={openFile}
              onFolderToggle={handleFolderToggle}
              onContextMenu={handleContextMenu}
              onConfirmCreate={handleConfirmCreate}
              onCancelCreate={handleCancelCreate}
              onConfirmRename={handleConfirmRename}
              onCancelRename={() => setRenamingState(null)}
            />
          ))}
        </div>
      </div>

      <div
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className="w-1 h-full cursor-col-resize z-20 transition-colors absolute right-0 -top-px bottom-0"
        style={handleStyle}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          path={contextMenu.path}
          type={contextMenu.type}
          onClose={closeContextMenu}
          onNewFile={() => handleStartCreate(contextMenu.path, 'file')}
          onNewFolder={() => handleStartCreate(contextMenu.path, 'folder')}
          onRename={handleStartRename}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
