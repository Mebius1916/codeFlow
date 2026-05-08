import type { AlgorithmOptions } from '@codify/design2code'

export interface ConvertFigmaDto {
  figmaUrl: string
  token: string
  algorithmOptions?: Partial<AlgorithmOptions>
  aiEnhance?: boolean
  aiOptions?: {
    model?: string
    apiKey: string
    baseUrl?: string
    temperature?: number
    targetSimilarity?: number
  }
}
