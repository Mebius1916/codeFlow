import type { ReactNode } from 'react'

interface FileTreeHeaderProps {
  withRightBorder?: boolean
  rightSlot?: ReactNode
}

export function FileTreeHeader({ withRightBorder, rightSlot }: FileTreeHeaderProps) {
  return (
    <div
      className={`h-full w-full flex items-center justify-between px-3 ${withRightBorder ? 'border-r' : ''}`}
      style={{
        backgroundColor: 'rgb(15, 17, 25)',
        borderRightColor: withRightBorder ? 'var(--fileTree-border-color, #2a2f4c)' : undefined,
      }}
    >
      <h3 className="text-xs font-semibold text-gray-300 uppercase tracking-wider">PROJECT FILES</h3>
      {rightSlot}
    </div>
  )
}
