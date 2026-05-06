import { Module } from '@nestjs/common'
import { FigmaController } from './figmaController.ts'
import { FigmaService } from './figmaService.ts'

@Module({
  controllers: [FigmaController],
  providers: [FigmaService],
})
export class FigmaModule {}
