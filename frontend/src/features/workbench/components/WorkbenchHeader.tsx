import { FileTreeHeader, useFileTreeResizeCssVars } from '@/features/fileTree'
import { usePreviewResizeCssVars } from '@/features/preview'
import { FileTabs } from './FileTabs'
import { PreviewHeader } from './PreviewHeader'

interface FileTabsState {
  activeFile: string | null
  openFiles: string[]
  onOpenFile: (path: string) => void
  onCloseFile: (path: string) => void
}

interface WorkbenchHeaderProps extends FileTabsState {
  onNewFile?: () => void
  onNewFolder?: () => void
  onPreviewRefresh?: () => void
  onPreviewFullscreenToggle?: () => void
  isPreviewFullscreen?: boolean
}

const WORKBENCH_BG = 'rgb(25, 30, 50)'


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

  return (
    <div className="h-10 flex items-center" style={{ backgroundColor: WORKBENCH_BG }}>
      <div
        className="flex-shrink-0 h-full overflow-hidden relative border-r border-[#2a2f4c] box-border"
        style={{ width: 'var(--fileTree-width, 250px)', borderRightColor: 'var(--fileTree-border-color, #2a2f4c)' }}
      >
        <FileTreeHeader withRightBorder={false} />
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
