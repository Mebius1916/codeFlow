import { FileTabsBar, type FileTabsBarProps } from './FileTabsBar'
import { FileTreeHeader, useFileTreeResizeCssVars } from '@collaborative-editor/file-tree'

export type TopBarProps = FileTabsBarProps & {
  onNewFile: () => void
  onNewFolder: () => void
  onShare?: () => void
  shareEnabled?: boolean
}

export function TopBar(props: TopBarProps) {
  const { onMouseDown, onMouseEnter, onMouseLeave, handleStyle } = useFileTreeResizeCssVars()

  return (
    <div className="h-10 bg-[#18181b] flex items-center">
      <div
        className="flex-shrink-0 h-full overflow-hidden relative border-r border-[#2a2f4c] box-border"
        style={{ width: 'var(--file-tree-width, 250px)', borderRightColor: 'var(--file-tree-border-color, #2a2f4c)' }}
      >
        <FileTreeHeader withRightBorder={false} onNewFile={props.onNewFile} onNewFolder={props.onNewFolder} />
        <div
          onMouseDown={onMouseDown}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-20 -mr-0.5 transition-colors"
          style={handleStyle}
        />
      </div>
      <div className="flex-1 flex items-center justify-between h-full">
        <FileTabsBar {...props} />
        {props.onShare && (
          <button
            className="mr-2 px-2 py-1 text-xs rounded bg-[#1f243a] hover:bg-[#2a314d] text-white"
            onClick={props.onShare}
          >
            {props.shareEnabled ? '已分享' : '分享'}
          </button>
        )}
      </div>
    </div>
  )
}
