function bufferToHex(buf: ArrayBuffer) {
  const bytes = new Uint8Array(buf)
  let out = ''
  for (let i = 0; i < bytes.length; i++) {
    out += bytes[i].toString(16).padStart(2, '0')
  }
  return out
}

export async function stableSha256Hex(input: string) {
  const data = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return bufferToHex(digest)
}

export async function cacheRoom(prefix: string, key: string) {
  return `${prefix}:${await stableSha256Hex(key)}`
}

