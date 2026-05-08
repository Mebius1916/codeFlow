export interface CodegenResult {
  html: string
  body: string
  css: string
  size?: { width: number; height: number }
}

export interface FigmaNodeRef {
  fileKey: string
  nodeId: string
}

export interface AiEnhanceResult {
  result?: { html: string; css: string }
  meta: { enabled: true; status: 'done' | 'failed'; error?: string }
}
