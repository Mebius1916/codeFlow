import 'reflect-metadata'
import { NestFactory } from '@nestjs/core'
import { AppModule } from './appModule.ts'
import { env } from './config/env.ts'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors({ origin: true })
  await app.listen(env.port)
}

void bootstrap()
