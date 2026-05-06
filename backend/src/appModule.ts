import { Module } from '@nestjs/common'
import { FigmaModule } from './figma/figmaModule.ts'
import { RenderModule } from './render/renderModule.ts'

@Module({
  imports: [FigmaModule, RenderModule],
})
export class AppModule {}
