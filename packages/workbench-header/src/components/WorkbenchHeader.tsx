import { FileTreeHeader, useFileTreeResizeCssVars } from '@collaborative-editor/file-tree'
import { usePreviewResizeCssVars } from '@collaborative-editor/preview'
import { FileTabs, type FileTabsProps } from './FileTabs'
import { PreviewHeader } from './PreviewHeader'

export type WorkbenchHeaderProps = FileTabsProps & {
  onNewFile?: () => void
  onNewFolder?: () => void
  onPreviewRefresh?: () => void
  onPreviewFullscreenToggle?: () => void
  isPreviewFullscreen?: boolean
}

const WORKBENCH_BG = 'rgb(25, 30, 50)'

function AddFileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 5v14" stroke="white" strokeOpacity="0.75" strokeWidth="2" strokeLinecap="round" />
      <path d="M5 12h14" stroke="white" strokeOpacity="0.75" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

function AddFolderIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 7a2 2 0 0 1 2-2h5l2 2h7a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"
        stroke="white"
        strokeOpacity="0.75"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M12 11v6" stroke="white" strokeOpacity="0.75" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 14h6" stroke="white" strokeOpacity="0.75" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function WorkbenchHeader(props: WorkbenchHeaderProps) {
  const {
    onMouseDown: onFileTreeMouseDown,
    onMouseEnter: onFileTreeMouseEnter,
    onMouseLeave: onFileTreeMouseLeave,
    handleStyle: fileTreeHandleStyle,
  } = useFileTreeResizeCssVars()

  const {
    onMouseDown: onPreviewMouseDown,
    onMouseEnter: onPreviewMouseEnter,
    onMouseLeave: onPreviewMouseLeave,
    handleStyle: previewHandleStyle,
  } = usePreviewResizeCssVars()

  const fileTreeRightSlot =
    props.onNewFile || props.onNewFolder ? (
      <div className="flex items-center gap-1">
        <button
          onClick={props.onNewFile}
          disabled={!props.onNewFile}
          className="w-7 h-7 rounded-md hover:bg-[#2a2f4c] transition-colors flex items-center justify-center disabled:opacity-40 disabled:hover:bg-transparent"
          title="新建文件"
        >
          <AddFileIcon />
        </button>
        <button
          onClick={props.onNewFolder}
          disabled={!props.onNewFolder}
          className="w-7 h-7 rounded-md hover:bg-[#2a2f4c] transition-colors flex items-center justify-center disabled:opacity-40 disabled:hover:bg-transparent"
          title="新建文件夹"
        >
          <AddFolderIcon />
        </button>
      </div>
    ) : undefined

  return (
    <div className="h-10 flex items-center" style={{ backgroundColor: WORKBENCH_BG }}>
      <div
        className="flex-shrink-0 h-full overflow-hidden relative border-r border-[#2a2f4c] box-border"
        style={{ width: 'var(--file-tree-width, 250px)', borderRightColor: 'var(--file-tree-border-color, #2a2f4c)' }}
      >
        <FileTreeHeader withRightBorder={false} rightSlot={fileTreeRightSlot} />
        <div
          onMouseDown={onFileTreeMouseDown}
          onMouseEnter={onFileTreeMouseEnter}
          onMouseLeave={onFileTreeMouseLeave}
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-20 transition-colors"
          style={fileTreeHandleStyle}
        />
      </div>
      <div className="flex-1 flex items-center h-full overflow-hidden">
        <div className="flex-1 h-full overflow-hidden">
          <FileTabs
            activeFile={props.activeFile}
            openFiles={props.openFiles}
            onOpenFile={props.onOpenFile}
            onCloseFile={props.onCloseFile}
          />
        </div>
        <div
          className="flex-shrink-0 h-full border-l overflow-hidden relative box-border transition-colors"
          style={{
            width: 'var(--preview-panel-width, 300px)',
            borderLeftColor: 'var(--preview-panel-border-color, #2a2f4c)',
            backgroundColor: WORKBENCH_BG,
          }}
        >
          <div
            onMouseDown={onPreviewMouseDown}
            onMouseEnter={onPreviewMouseEnter}
            onMouseLeave={onPreviewMouseLeave}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-20 transition-colors"
            style={{
              ...previewHandleStyle,
              backgroundColor: 'var(--preview-panel-handle-bg, transparent)',
            }}
          />
          <PreviewHeader
            onRefresh={props.onPreviewRefresh}
            onFullscreenToggle={props.onPreviewFullscreenToggle}
            isFullscreen={props.isPreviewFullscreen}
          />
        </div>
      </div>
    </div>
  )
}
