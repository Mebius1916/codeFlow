export interface FigmaCodegenResult {
  html: string
  body: string
  css: string
  size?: { width: number; height: number }
}

export interface FigmaConvertResult {
  codegenResult: FigmaCodegenResult
  aiEnhancedResult?: {
    html: string
    css: string
  }
  aiEnhanceMeta?: {
    enabled: boolean
    status: 'skipped' | 'done' | 'failed'
    error?: string
  }
}
