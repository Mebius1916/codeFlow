export const roomFilesIndexKey = (room: string) => `${room}::files`
export const roomFileKey = (room: string, path: string) => `${room}::file::${encodeURIComponent(path)}`
export const roomUpdatesKey = (room: string) => `${room}::updates`

export const roomsIndexKey = `__rooms_index__`

