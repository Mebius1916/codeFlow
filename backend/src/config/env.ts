import 'dotenv/config'

interface EnvConfig {
  port: number
  s3: {
    bucket: string
    region: string
    endpoint: string
    accessKeyId: string
    secretAccessKey: string
    publicBaseUrl: string
  }
}

function requireEnv(name: string) {
  const value = process.env[name]?.trim()

  if (!value) {
    throw new Error(`缺少环境变量 ${name}`)
  }

  return value
}

export const env: EnvConfig = {
  port: Number(process.env.PORT ?? '3001'),
  s3: {
    bucket: requireEnv('S3_BUCKET'),
    region: requireEnv('S3_REGION'),
    endpoint: requireEnv('S3_ENDPOINT'),
    accessKeyId: requireEnv('S3_ACCESS_KEY_ID'),
    secretAccessKey: requireEnv('S3_SECRET_ACCESS_KEY'),
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL?.trim().replace(/\/+$/, '') || '',
  },
}
