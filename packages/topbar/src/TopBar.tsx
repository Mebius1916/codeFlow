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
        className="flex-shrink-0 h-full overflow-hidden relative border-r box-border"
        style={{ width: 'var(--file-tree-width, 250px)', borderRightColor: 'var(--file-tree-border-color, #2a2f4c)' }}
      >
        <FileTreeHeader withRightBorder={false} onNewFile={props.onNewFile} onNewFolder={props.onNewFolder} />
        <div
          onMouseDown={onMouseDown}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className={`
            w-1 h-full cursor-col-resize z-20 transition-colors
            absolute right-0 top-0 -bottom-px
          `}
          style={handleStyle}
        />
      </div>
      <FileTabsBar {...props} />
    </div>
  )
}

