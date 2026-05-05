import { Body, Controller, Post } from '@nestjs/common'
import type { AlgorithmOptions } from '@codify/design2code'
import { FigmaService } from './figmaService.ts'

export interface ConvertFigmaDto {
  figmaUrl: string
  token: string
  algorithmOptions?: Partial<AlgorithmOptions>
}

@Controller('/api/figma')
export class FigmaController {
  constructor(private readonly figmaService: FigmaService) {}

  @Post('/convert')
  convert(@Body() body: ConvertFigmaDto) {
    return this.figmaService.convert(body)
  }
}
