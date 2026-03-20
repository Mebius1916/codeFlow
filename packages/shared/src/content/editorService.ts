import type { ContentRepository, FileContent } from './localForageContentRepository'
import { useEditorStore } from '../store/editor-store'

let contentRepository: ContentRepository | null = null

export function setContentRepository(repo: ContentRepository | null) {
  contentRepository = repo
}

export function getContentRepository() {
  return contentRepository
}

export function openFile(path: string) {
  useEditorStore.getState().openFile(path)
}

export function closeFile(path: string) {
  useEditorStore.getState().closeFile(path)
}

export function setFileContent(path: string, content: FileContent) {
  useEditorStore.getState().updateFileContent(path, content)
  if (contentRepository) {
    void contentRepository.saveFile(path, content)
  }
}

export function addFile(path: string, content: FileContent = '') {
  useEditorStore.getState().addFile(path, content)
  if (contentRepository) {
    void contentRepository.saveFile(path, content)
  }
}

export function deleteFile(path: string) {
  useEditorStore.getState().deleteFile(path)
  if (contentRepository) {
    void contentRepository.deleteFile(path)
  }
}

export function renameFile(oldPath: string, newPath: string) {
  const content = useEditorStore.getState().files[oldPath]
  useEditorStore.getState().renameFile(oldPath, newPath)
  if (!contentRepository) return
  if (typeof content === 'string' || content instanceof Uint8Array) {
    void contentRepository.renameFile(oldPath, newPath)
  }
}
