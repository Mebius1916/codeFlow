import { FileTabsBar, type FileTabsBarProps } from './FileTabsBar'
import { FileTreeHeader, useFileTreeResizeCssVars } from '@collaborative-editor/file-tree'
import { TopBarActions } from './TopBarActions'
import { usePreviewResizeCssVars } from '@collaborative-editor/preview'

export type TopBarProps = FileTabsBarProps & {
  onNewFile: () => void
  onNewFolder: () => void
  onPreviewRefresh?: () => void
  onPreviewFullscreenToggle?: () => void
  isPreviewFullscreen?: boolean
}

export function TopBar(props: TopBarProps) {
  const { 
    onMouseDown: onFileTreeMouseDown, 
    onMouseEnter: onFileTreeMouseEnter, 
    onMouseLeave: onFileTreeMouseLeave, 
    handleStyle: fileTreeHandleStyle 
  } = useFileTreeResizeCssVars()

  const {
    onMouseDown: onPreviewMouseDown,
    onMouseEnter: onPreviewMouseEnter,
    onMouseLeave: onPreviewMouseLeave,
    handleStyle: previewHandleStyle
  } = usePreviewResizeCssVars()

  return (
    <div className="h-10 flex items-center" style={{ backgroundColor: 'rgb(25, 30, 50)' }}>
      <div
        className="flex-shrink-0 h-full overflow-hidden relative border-r border-[#2a2f4c] box-border"
        style={{ width: 'var(--file-tree-width, 250px)', borderRightColor: 'var(--file-tree-border-color, #2a2f4c)' }}
      >
        <FileTreeHeader withRightBorder={false}/>
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
          <FileTabsBar {...props} />
        </div>
        <div 
          className="flex-shrink-0 h-full border-l overflow-hidden relative box-border transition-colors"
          style={{ 
            width: 'var(--preview-panel-width, 300px)', 
            borderLeftColor: 'var(--preview-panel-border-color, #2a2f4c)',
            backgroundColor: 'rgb(25, 30, 50)'
          }}
        >
          <div
            onMouseDown={onPreviewMouseDown}
            onMouseEnter={onPreviewMouseEnter}
            onMouseLeave={onPreviewMouseLeave}
            className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-20 transition-colors"
            style={{ 
              ...previewHandleStyle,
              backgroundColor: 'var(--preview-panel-handle-bg, transparent)'
            }}
          />
          <TopBarActions
            onPreviewRefresh={props.onPreviewRefresh}
            onPreviewFullscreenToggle={props.onPreviewFullscreenToggle}
            isPreviewFullscreen={props.isPreviewFullscreen}
          />
        </div>
      </div>
    </div>
  )
}
