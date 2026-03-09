interface FileTreeHeaderProps {
  withRightBorder?: boolean
}

export function FileTreeHeader({ withRightBorder }: FileTreeHeaderProps) {
  return (
    <div
      className={`h-full w-full flex items-center justify-between px-3 ${withRightBorder ? 'border-r' : ''}`}
      style={{
        backgroundColor: 'rgb(15, 17, 25)',
        borderRightColor: withRightBorder ? 'var(--file-tree-border-color, #2a2f4c)' : undefined,
      }}
    >
      <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">PROJECT FILES</h3>
    </div>
  )
}
