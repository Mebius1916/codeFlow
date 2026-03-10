type CryptoLike = {
  randomUUID?: () => string
  getRandomValues: (array: Uint8Array) => Uint8Array
}

export function createRoomId() {
  const c: CryptoLike | undefined =
    typeof globalThis === 'object' && globalThis && 'crypto' in globalThis
      ? (globalThis as unknown as { crypto?: CryptoLike }).crypto
      : undefined
  if (c) {
    if (c.randomUUID) {
      return c.randomUUID()
    }
    const bytes = new Uint8Array(16)
    c.getRandomValues(bytes)
    return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`
}

export function getRoomIdFromUrl() {
  if (typeof window === 'undefined') return null
  const match = window.location.pathname.match(/^\/room\/([^/]+)\/?$/)
  if (!match) return null
  return decodeURIComponent(match[1])
}

export function setRoomIdInUrl(roomId: string) {
  if (typeof window === 'undefined') return
  window.history.replaceState(null, '', `/room/${encodeURIComponent(roomId)}`)
}
