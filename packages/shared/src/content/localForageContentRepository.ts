import localforage from 'localforage'

export type FileContent = string | Uint8Array

export type ContentRepository = {
  loadAll: () => Promise<{ files: Record<string, FileContent>; fileKeys: string[] }>
  saveFile: (path: string, content: FileContent) => Promise<void>
  deleteFile: (path: string) => Promise<void>
  renameFile: (oldPath: string, newPath: string) => Promise<void>
  bootstrapIfEmpty: (files: Record<string, FileContent>) => Promise<boolean>
}

const makeIndexKey = (roomId: string) => `${roomId}:__index__`
const makeFileKey = (roomId: string, path: string) => `${roomId}:file:${path}`

const ensureRoomId = (roomId: string) => (roomId ? roomId : '__default__')

export function createLocalForageContentRepository(roomId: string): ContentRepository {
  const normalizedRoomId = ensureRoomId(roomId)
  const store = localforage.createInstance({ name: 'codeflow-content' })

  const loadIndex = async (): Promise<string[]> => {
    const raw = await store.getItem<unknown>(makeIndexKey(normalizedRoomId))
    if (!Array.isArray(raw)) return []
    return raw.filter((v): v is string => typeof v === 'string')
  }

  const saveIndex = async (fileKeys: string[]) => {
    await store.setItem(makeIndexKey(normalizedRoomId), fileKeys)
  }

  const loadAll = async () => {
    const fileKeys = await loadIndex()
    const files: Record<string, FileContent> = {}
    await Promise.all(
      fileKeys.map(async (path) => {
        const value = await store.getItem<FileContent>(makeFileKey(normalizedRoomId, path))
        if (typeof value === 'string' || value instanceof Uint8Array) {
          files[path] = value
        }
      }),
    )
    return { files, fileKeys }
  }

  const saveFile = async (path: string, content: FileContent) => {
    await store.setItem(makeFileKey(normalizedRoomId, path), content)
    const fileKeys = await loadIndex()
    if (!fileKeys.includes(path)) {
      await saveIndex([...fileKeys, path])
    }
  }

  const deleteFile = async (path: string) => {
    await store.removeItem(makeFileKey(normalizedRoomId, path))
    const fileKeys = await loadIndex()
    if (fileKeys.includes(path)) {
      await saveIndex(fileKeys.filter((k) => k !== path))
    }
  }

  const renameFile = async (oldPath: string, newPath: string) => {
    const oldKey = makeFileKey(normalizedRoomId, oldPath)
    const value = await store.getItem<FileContent>(oldKey)
    if (!(typeof value === 'string' || value instanceof Uint8Array)) return

    await store.setItem(makeFileKey(normalizedRoomId, newPath), value)
    await store.removeItem(oldKey)

    const fileKeys = await loadIndex()
    const nextKeys = fileKeys.includes(oldPath)
      ? fileKeys.map((k) => (k === oldPath ? newPath : k))
      : [...fileKeys, newPath]
    await saveIndex(nextKeys)
  }

  const bootstrapIfEmpty = async (files: Record<string, FileContent>) => {
    const existingKeys = await loadIndex()
    if (existingKeys.length > 0) return false

    const entries = Object.entries(files)
    await Promise.all(entries.map(([path, content]) => store.setItem(makeFileKey(normalizedRoomId, path), content)))
    await saveIndex(entries.map(([path]) => path))
    return true
  }

  return {
    loadAll,
    saveFile,
    deleteFile,
    renameFile,
    bootstrapIfEmpty,
  }
}
