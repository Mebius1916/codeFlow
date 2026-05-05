import { Module } from '@nestjs/common'
import { FigmaModule } from './figma/figmaModule.ts'

@Module({
  imports: [FigmaModule],
})
export class AppModule {}
