import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
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
    const objectUrl = `${env.s3.endpoint}/${env.s3.bucket}/${key}`

    try {
      await this.client.send(new HeadObjectCommand({
        Bucket: env.s3.bucket,
        Key: key,
      }))
      return objectUrl
    } catch (error) {
      if ((error as { $metadata?: { httpStatusCode?: number } })
        .$metadata?.httpStatusCode !== 404) {
        throw error
      }
    }

    await this.client.send(new PutObjectCommand({
      Bucket: env.s3.bucket,
      Key: key,
      Body: body,
      ContentType: contentType || 'application/octet-stream',
      CacheControl: 'public, max-age=31536000, immutable',
    }))

    return objectUrl
  }
}
