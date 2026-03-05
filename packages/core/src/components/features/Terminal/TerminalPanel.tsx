import { useUiStore } from '../../../lib/store'
import { Terminal } from '.'
import { useFeatures } from '../../../lib/context/FeatureContext'
import { useResizable } from '../../hooks'

export function TerminalPanel() {
  const { terminalHeight, setTerminalHeight } = useUiStore()
  const { terminal: isEnabled } = useFeatures()
  
  const { isDragging, handleMouseDown } = useResizable({
    initialSize: terminalHeight,
    onSizeChange: setTerminalHeight,
    direction: 'top',
    minSize: 100,
    maxSize: 600
  })

  // 如果功能被禁用，则不渲染
  if (isEnabled === false) {
    return null
  }

  return (
    <>
      {/* Resizer Handle */}
      <div
        onMouseDown={handleMouseDown}
        className={`
          h-1.5 w-full cursor-row-resize z-20 hover:bg-blue-500/50 transition-colors
          ${isDragging ? 'bg-blue-500' : 'bg-transparent'}
          absolute left-0
        `}
        style={{ bottom: terminalHeight - 3 }}
      />
      
      {/* Terminal Panel */}
      <div 
        className="border-t border-[#2a2f4c] bg-[#1e1e1e] overflow-hidden"
        style={{ height: terminalHeight }}
      >
        <Terminal />
      </div>
    </>
  )
}
