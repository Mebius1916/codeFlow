export function ensureUint8Array(content: unknown): Uint8Array | string | null {
  if (content === null || content === undefined) return null
  if (typeof content === 'string') return content
  if (content instanceof Uint8Array) return content

  if (typeof content === 'object') {
    const obj = content as any
    if (obj.type === 'Buffer' && Array.isArray(obj.data)) {
      return new Uint8Array(obj.data)
    }
    if (obj.constructor === Object) {
      return new Uint8Array(Object.values(obj))
    }
  }

  return content as string | Uint8Array
}
