const sessionAssetUrlMap = new Map<string, string>()

export function clearSessionAssetUrlMap() {
  sessionAssetUrlMap.clear()
}

export function getSessionAssetUrlMap() {
  return new Map(sessionAssetUrlMap)
}

export function setSessionAssetUrl(path: string, url: string) {
  sessionAssetUrlMap.set(path, url)
}

