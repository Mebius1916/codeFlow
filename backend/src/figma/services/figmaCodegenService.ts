import { BadRequestException, Injectable } from '@nestjs/common'
import { convertFigmaToCode } from '@codify/design2code'
import type { ConvertFigmaDto } from '../dto/convertFigmaDto.ts'
import type { CodegenResult, FigmaNodeRef } from '../types/figmaTypes.ts'

@Injectable()
export class FigmaCodegenService {
  async generate(input: {
    figmaData: unknown
    nodeRef: FigmaNodeRef
    token: string
    algorithmOptions: ConvertFigmaDto['algorithmOptions']
  }): Promise<CodegenResult> {
    try {
      const result = await convertFigmaToCode(
        input.figmaData as Parameters<typeof convertFigmaToCode>[0],
        {
          algorithmOptions: input.algorithmOptions,
          fileKey: input.nodeRef.fileKey,
          token: input.token,
          scale: 1,
          format: 'png',
        },
      )
      return { html: result.html, body: result.body, css: result.css, size: result.size }
    } catch {
      throw new BadRequestException('Figma 转换失败')
    }
  }
}
