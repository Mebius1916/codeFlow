import type { FigmaCodegenResult } from '@/features/figma/interfaces/model'

export interface TailwindFragmentResult {
  fragment: string
  size?: FigmaCodegenResult['size']
}

export type BuildTailwindFragmentInput = FigmaCodegenResult
