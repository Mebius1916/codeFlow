import React from 'react'
import cssIcon from '@assets/Css.svg'
import jsxIcon from '@assets/Jsx.svg'
import assetsIcon from '@assets/Purple.svg'
import svgIcon from '@assets/Svg.svg'
import srcIcon from '@assets/Yellow.svg'
import imageIcon from '@assets/Image.svg'

interface FileIconProps {
  name: string
  isFolder: boolean
  isOpen?: boolean
}

export const FileIcon: React.FC<FileIconProps> = ({ name, isFolder }) => {
  const getIconSrc = () => {
    if (isFolder) {
      if (name === 'src') return srcIcon
      if (name === 'assets' || name === 'icons' || name === 'images') return assetsIcon
      return srcIcon
    }

    const lowerName = name.toLowerCase()

    if (lowerName.endsWith('.css') || lowerName.endsWith('.less') || lowerName.endsWith('.scss')) {
      return cssIcon
    }

    if (lowerName.endsWith('.svg')) {
      return svgIcon
    }
    if (lowerName.endsWith('.png') || lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) {
      return imageIcon
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
