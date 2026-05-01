export function ensureUint8Array(content: unknown): Uint8Array | string | null {
  if (content === null || content === undefined) return null
  if (typeof content === 'string') return content
  if (content instanceof Uint8Array) return content

  if (typeof content === 'object') {
    const record = content as Record<string, unknown> & {
      type?: unknown
      data?: unknown
      constructor?: unknown
    }
    if (record.type === 'Buffer' && Array.isArray(record.data)) {
      return new Uint8Array(record.data as number[])
    }
    if (record.constructor === Object) {
      return new Uint8Array(Object.values(record) as number[])
    }
  }

  return content as string | Uint8Array
}
