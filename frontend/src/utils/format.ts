const VOID_HTML_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
])

const RAW_TEXT_TAGS = new Set(['script', 'style', 'pre', 'code', 'textarea'])

const repeatIndent = (level: number) => (level <= 0 ? '' : '  '.repeat(level))

const getTagName = (tag: string) => {
  const m = tag.match(/^<\/?\s*([a-zA-Z0-9-]+)/)
  return m?.[1]?.toLowerCase() ?? null
}

export function formatHtml(input: string): string {
  const html = (input ?? '').replace(/\r\n/g, '\n').trim()
  if (!html) return ''

  const tokens = html.split(/(<[^>]+>)/g).filter((t) => t.length > 0)
  const lines: string[] = []

  let indent = 0
  let rawTag: string | null = null

  for (const token of tokens) {
    if (rawTag) {
      lines.push(repeatIndent(indent) + token)
      const maybeClose = token.match(new RegExp(`</\\s*${rawTag}\\s*>`, 'i'))
      if (maybeClose) {
        rawTag = null
      }
      continue
    }

    if (!token.startsWith('<')) {
      const text = token.replace(/\s+/g, ' ').trim()
      if (text) lines.push(repeatIndent(indent) + text)
      continue
    }

    const tag = token.trim()
    if (/^<!doctype/i.test(tag) || /^<!--/.test(tag)) {
      lines.push(repeatIndent(indent) + tag)
      continue
    }

    const isClosing = /^<\//.test(tag)
    const tagName = getTagName(tag)
    const isSelfClosing = /\/>$/.test(tag) || (tagName ? VOID_HTML_TAGS.has(tagName) : false)

    if (isClosing) {
      indent = Math.max(0, indent - 1)
      lines.push(repeatIndent(indent) + tag)
      continue
    }

    lines.push(repeatIndent(indent) + tag)

    if (tagName && RAW_TEXT_TAGS.has(tagName) && !isSelfClosing) {
      rawTag = tagName
      continue
    }

    if (!isSelfClosing) {
      indent += 1
    }
  }

  return lines.join('\n')
}

export function formatCss(input: string): string {
  const css = (input ?? '').replace(/\r\n/g, '\n').trim()
  if (!css) return ''

  let indent = 0
  let inSingleQuote = false
  let inDoubleQuote = false
  let inBlockComment = false
  let inLineComment = false

  const out: string[] = []
  let line = ''

  const flushLine = () => {
    const trimmed = line.trim()
    if (trimmed.length > 0) out.push(repeatIndent(indent) + trimmed)
    line = ''
  }

  for (let i = 0; i < css.length; i += 1) {
    const ch = css[i]
    const next = css[i + 1]

    if (inLineComment) {
      line += ch
      if (ch === '\n') {
        inLineComment = false
        flushLine()
      }
      continue
    }

    if (inBlockComment) {
      line += ch
      if (ch === '*' && next === '/') {
        line += next
        i += 1
        inBlockComment = false
      }
      continue
    }

    if (!inSingleQuote && !inDoubleQuote) {
      if (ch === '/' && next === '*') {
        line += ch + next
        i += 1
        inBlockComment = true
        continue
      }
      if (ch === '/' && next === '/') {
        line += ch + next
        i += 1
        inLineComment = true
        continue
      }
    }

    if (ch === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote
      line += ch
      continue
    }
    if (ch === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote
      line += ch
      continue
    }

    if (!inSingleQuote && !inDoubleQuote) {
      if (ch === '{') {
        line += ' {'
        flushLine()
        indent += 1
        continue
      }
      if (ch === '}') {
        flushLine()
        indent = Math.max(0, indent - 1)
        out.push(repeatIndent(indent) + '}')
        continue
      }
      if (ch === ';') {
        line += ';'
        flushLine()
        continue
      }
      if (ch === '\n') {
        flushLine()
        continue
      }
      if (ch === '\t') {
        line += ' '
        continue
      }
    }

    line += ch
  }

  flushLine()
  return out.join('\n')
}

