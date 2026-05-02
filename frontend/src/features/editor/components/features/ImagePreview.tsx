import { useEditorStore } from '@/features/workspace/store/editorStore'
import { useImageBlob } from '../../hooks/useImageBlob'

export function ImagePreview() {
  const activeFile = useEditorStore((state) => state.activeFile)
  const files = useEditorStore((state) => state.files)
  const activeContent = activeFile ? files[activeFile] ?? null : null

  const blobUrl = useImageBlob(activeContent, activeFile || undefined)
  const svgText = typeof activeContent === 'string' && activeContent.trim().startsWith('<svg')

  if (!activeFile) return null

  return (
    <div className="flex flex-col items-center justify-center h-full bg-[#15172A] p-8 overflow-hidden">
      <div className="relative max-w-full max-h-full flex items-center justify-center p-4 shadow-lg bg-white">
        {svgText ? (
          <div
            className="max-w-full max-h-[80vh] object-contain"
            dangerouslySetInnerHTML={{ __html: activeContent as string }}
          />
        ) : (
          blobUrl && <img src={blobUrl} alt={activeFile} className="max-w-full max-h-[80vh] object-contain" />
        )}
      </div>
      <div className="mt-4 text-gray-400 text-sm font-mono">{activeFile.split('/').pop()}</div>
    </div>
  )
}
