const sessionAssetPathMap = new Map<string, string>()

export function clearSessionAssetPathMap() {
  sessionAssetPathMap.clear()
}

export function getSessionAssetPathMap() {
  return new Map(sessionAssetPathMap)
}

export function setSessionAssetPath(path: string) {
  sessionAssetPathMap.set(path, path)
}
