import { useUiStore, useEditorStore } from '../../../lib/store'
import { useFeatures } from '../../../lib/context/FeatureContext'
import { useResizablePanel, useFileTreeData } from '../../hooks'
import { FileTreeNode } from './FileTreeNode'
import { NewFileItem } from './NewFileItem'
import { ContextMenu } from './ContextMenu'
import { useFileTreeActions } from './useFileTreeActions'
import { FileTreeHeader } from './FileTreeHeader'

export { FileTreeHeader }

type FileTreeActions = ReturnType<typeof useFileTreeActions>

interface FileTreePanelProps {
  actions?: FileTreeActions
  showHeader?: boolean
}

export function FileTreePanel({ actions, showHeader }: FileTreePanelProps) {
  const { fileTreeWidth, setFileTreeWidth } = useUiStore()
  const { files, activeFile, openFile } = useEditorStore()
  const { fileTree: isEnabled, toolbar: isToolbarEnabled } = useFeatures()
  
  // 使用自定义 Hook 获取树形数据
  const { fileTree, handleFolderToggle } = useFileTreeData(files)

  // 使用自定义 Hook 处理调整大小
  const { isDragging, handleMouseDown } = useResizablePanel({
    initialWidth: fileTreeWidth,
    onWidthChange: setFileTreeWidth
  })

  // 使用自定义 Hook 处理业务逻辑
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
    setRenamingState
  } = actions ?? useFileTreeActions()

  // 如果功能被禁用，则不渲染
  if (isEnabled === false) {
    return null
  }

  const shouldShowHeader = showHeader ?? (isToolbarEnabled === false)

  return (
    <div 
      className="flex h-full relative group"
      onContextMenu={(e) => handleContextMenu(e, null)}
    >
      {/* File Tree Panel */}
      <div 
        className="h-full flex flex-col"
        style={{ width: '100%', backgroundColor: 'rgb(15, 17, 25)' }}
      >
        {shouldShowHeader && (
          <FileTreeHeader
            width={fileTreeWidth}
            onNewFile={() => handleStartCreate(null, 'file')}
            onNewFolder={() => handleStartCreate(null, 'folder')}
          />
        )}
        
        <div className="flex-1 overflow-y-auto py-2">
          {/* 根目录的新建输入框 */}
          {creatingState?.parentPath === null && (
            <NewFileItem 
              depth={0}
              type={creatingState.type}
              onCommit={handleConfirmCreate}
              onCancel={handleCancelCreate}
            />
          )}
          
          {fileTree.map(node => (
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

      {/* Resizer Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`
          w-1 h-full cursor-col-resize z-20 hover:bg-blue-500/50 transition-colors
          ${isDragging ? 'bg-blue-500' : 'bg-transparent'}
          absolute right-0 top-0 bottom-0
        `}
      />

      {/* 右键菜单 */}
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
