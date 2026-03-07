import { useEditorStore } from '@collaborative-editor/shared'

export function ImagePreview() {
  const activeFile = useEditorStore((state) => state.activeFile)
  const content = useEditorStore((state) => (state.activeFile ? state.files[state.activeFile] : null))

  if (!activeFile) return null

  const src = content

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#15172A] p-8 overflow-hidden">
      <div className="relative max-w-full max-h-full flex items-center justify-center p-4 shadow-lg">
        <img src={src || ''} alt={activeFile} className="max-w-full max-h-[80vh] object-contain" />
      </div>
      <div className="mt-4 text-gray-400 text-sm font-mono">{activeFile.split('/').pop()}</div>
    </div>
  )
}

