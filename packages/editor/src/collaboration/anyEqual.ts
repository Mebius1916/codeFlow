export type AnyContent = string | Uint8Array

const bytesEqual = (a?: Uint8Array, b?: Uint8Array) => {
  if (!a || !b) return false
  if (a.byteLength !== b.byteLength) return false
  for (let i = 0; i < a.byteLength; i += 1) {
    if (a[i] !== b[i]) return false
  }
  return true
}

export const anyEqual = (a?: AnyContent, b?: AnyContent) => {
  if (typeof a === 'string' && typeof b === 'string') return a === b
  if (a instanceof Uint8Array && b instanceof Uint8Array) return bytesEqual(a, b)
  return false
}
