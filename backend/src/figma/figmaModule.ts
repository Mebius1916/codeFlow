import { Module } from '@nestjs/common'
import { ObjectStorageService } from '../storage/objectStorageService.ts'
import { FigmaController } from './figmaController.ts'
import { FigmaService } from './figmaService.ts'

@Module({
  controllers: [FigmaController],
  providers: [FigmaService, ObjectStorageService],
})
export class FigmaModule {}
