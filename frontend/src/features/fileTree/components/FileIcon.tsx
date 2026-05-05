import React from 'react'
import cssIcon from '@assets/Css.svg'
import jsxIcon from '@assets/Jsx.svg'
import srcIcon from '@assets/Yellow.svg'

interface FileIconProps {
  name: string
  isFolder: boolean
  isOpen?: boolean
}

export const FileIcon: React.FC<FileIconProps> = ({ name, isFolder }) => {
  const getIconSrc = () => {
    if (isFolder) {
      return srcIcon
    }

    const lowerName = name.toLowerCase()

    if (lowerName.endsWith('.css') || lowerName.endsWith('.less') || lowerName.endsWith('.scss')) {
      return cssIcon
    }

    if (
      lowerName.endsWith('.js') ||
      lowerName.endsWith('.jsx') ||
      lowerName.endsWith('.ts') ||
      lowerName.endsWith('.tsx') ||
      lowerName.endsWith('.html')
    ) {
      return jsxIcon
    }

    return null
  }

  const iconSrc = getIconSrc()

  if (!iconSrc) {
    const lowerName = name.toLowerCase()

    let content
    if (lowerName.endsWith('.md')) content = <span className="text-[10px]">📝</span>
    else if (lowerName.endsWith('.json')) content = <span className="text-[10px] font-bold text-yellow-500">{'{}'}</span>
    else content = <span className="text-[10px]">📄</span>

    return (
      <div className="w-4 h-4 flex items-center justify-center">
        {content}
      </div>
    )
  }

  return (
    <div className="w-4 h-4 flex items-center justify-center">
      <img
        src={iconSrc}
        alt={name}
        className="w-full h-full object-contain select-none"
        draggable={false}
      />
    </div>
  )
}
