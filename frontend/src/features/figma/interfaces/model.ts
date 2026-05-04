export interface FigmaCodegenResult {
  html: string
  body: string
  css: string
  size?: { width: number; height: number }
}

export interface FigmaParseResult {
  assets_path_map: Map<string, string>
  codegen_result: FigmaCodegenResult | null
}
