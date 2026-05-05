export interface FigmaCodegenResult {
  html: string
  body: string
  css: string
  size?: { width: number; height: number }
}

export interface FigmaConvertResult {
  codegenResult: FigmaCodegenResult
}
