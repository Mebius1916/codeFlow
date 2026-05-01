import { useState, useRef, useEffect } from 'react'
import type { KeyboardEvent, ChangeEvent } from 'react'

interface NewFileItemProps {
  depth: number
  type: 'file' | 'folder'
  initialValue?: string
  onCommit: (name: string) => void
  onCancel: () => void
}

export const NewFileItem = ({ depth, type, initialValue = '', onCommit, onCancel }: NewFileItemProps) => {
  const [value, setValue] = useState(initialValue)
  const inputRef = useRef<HTMLInputElement>(null)
  const paddingLeft = depth * 12 + 12

  useEffect(() => {
    inputRef.current?.focus()
    if (initialValue) {
      const dotIndex = initialValue.lastIndexOf('.')
      if (dotIndex > 0) {
        inputRef.current?.setSelectionRange(0, dotIndex)
      } else {
        inputRef.current?.select()
      }
    }
  }, [])

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (value.trim()) {
        onCommit(value.trim())
      } else {
        onCancel()
      }
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  const handleBlur = () => {
    if (value.trim()) {
      onCommit(value.trim())
    } else {
      onCancel()
    }
  }

  return (
    <div className="flex items-center gap-1.5 py-1 text-sm select-none border-l-2 border-transparent" style={{ paddingLeft }}>
      <span className="opacity-70 flex-shrink-0 w-4 text-center text-base">
        {type === 'folder' ? '📁' : '📄'}
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        className="bg-[#3c3c3c] text-white border border-[#007fd4] -ml-[1px] px-1 py-0 w-[calc(100%-24px)] outline-none h-6 leading-tight text-sm focus:border-[#007fd4]"
      />
    </div>
  )
}
