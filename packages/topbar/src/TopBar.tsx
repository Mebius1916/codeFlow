import { FileTabsBar, type FileTabsBarProps } from './FileTabsBar'
import { FileTreeHeader, useFileTreeResizeCssVars } from '@collaborative-editor/file-tree'

export type TopBarProps = FileTabsBarProps & {
  onNewFile: () => void
  onNewFolder: () => void
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
      <FileTabsBar {...props} />
    </div>
  )
}
