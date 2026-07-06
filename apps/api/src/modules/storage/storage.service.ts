import { extname } from 'node:path';
import { randomUUID } from 'node:crypto';

import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Env } from '../../config/env.validation';

export interface PresignedUpload {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

/**
 * Almacenamiento de archivos en MinIO (S3-compatible).
 * - `admin`: cliente con endpoint interno (backend → minio) para operaciones.
 * - `presigner`: cliente con endpoint público (navegador) para firmar subidas.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private readonly admin: S3Client;
  private readonly presigner: S3Client;
  private readonly bucket: string;
  private readonly publicUrl: string;

  constructor(config: ConfigService<Env, true>) {
    const accessKeyId = config.get('MINIO_ACCESS_KEY', { infer: true });
    const secretAccessKey = config.get('MINIO_SECRET_KEY', { infer: true });
    this.bucket = config.get('MINIO_BUCKET', { infer: true });
    this.publicUrl = config.get('MINIO_PUBLIC_URL', { infer: true }).replace(/\/$/, '');

    const credentials = { accessKeyId, secretAccessKey };
    const region = 'us-east-1';
    this.admin = new S3Client({
      endpoint: config.get('MINIO_ENDPOINT', { infer: true }),
      region,
      credentials,
      forcePathStyle: true,
    });
    this.presigner = new S3Client({
      endpoint: this.publicUrl,
      region,
      credentials,
      forcePathStyle: true,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.admin.send(new HeadBucketCommand({ Bucket: this.bucket }));
    } catch {
      try {
        await this.admin.send(new CreateBucketCommand({ Bucket: this.bucket }));
      } catch (error) {
        this.logger.warn(
          `No se pudo crear el bucket "${this.bucket}": ${(error as Error).message}`,
        );
        return;
      }
    }

    // Lectura pública de los objetos (dev): permite mostrar las imágenes por URL.
    const policy = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: { AWS: ['*'] },
          Action: ['s3:GetObject'],
          Resource: [`arn:aws:s3:::${this.bucket}/*`],
        },
      ],
    };
    try {
      await this.admin.send(
        new PutBucketPolicyCommand({ Bucket: this.bucket, Policy: JSON.stringify(policy) }),
      );
    } catch (error) {
      this.logger.warn(`No se pudo aplicar la política pública: ${(error as Error).message}`);
    }
    this.logger.log(`Almacenamiento MinIO listo (bucket "${this.bucket}")`);
  }

  async presignUpload(
    keyPrefix: string,
    filename: string,
    contentType: string,
  ): Promise<PresignedUpload> {
    const key = `${keyPrefix}/${randomUUID()}${extname(filename).toLowerCase()}`;
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: contentType,
    });
    const uploadUrl = await getSignedUrl(this.presigner, command, { expiresIn: 600 });
    return { uploadUrl, fileUrl: `${this.publicUrl}/${this.bucket}/${key}`, key };
  }
}
