import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { Injectable } from '@nestjs/common'
import { env } from '../config/env.ts'

@Injectable()
export class ObjectStorageService {
  private readonly client = new S3Client({
    region: env.s3.region,
    endpoint: env.s3.endpoint,
    credentials: {
      accessKeyId: env.s3.accessKeyId,
      secretAccessKey: env.s3.secretAccessKey,
    },
  })

  async uploadPublicObject(key: string, body: string | Uint8Array, contentType: string) {
    await this.client.send(new PutObjectCommand({
      Bucket: env.s3.bucket,
      Key: key,
      Body: body,
      ContentType: contentType || 'application/octet-stream',
      CacheControl: 'public, max-age=31536000, immutable',
    }))

    if (env.s3.publicBaseUrl) {
      return `${env.s3.publicBaseUrl}/${key}`
    }

    return `${env.s3.endpoint}/${env.s3.bucket}/${key}`
  }
}
