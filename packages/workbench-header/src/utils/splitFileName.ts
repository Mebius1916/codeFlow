export function splitFileName(name: string): { stem: string; ext: string } {
  if (name.endsWith('.d.ts')) return { stem: name.slice(0, -'.d.ts'.length), ext: '.d.ts' }
  const lastDot = name.lastIndexOf('.')
  if (lastDot <= 0) return { stem: name, ext: '' }
  return { stem: name.slice(0, lastDot), ext: name.slice(lastDot) }
}
