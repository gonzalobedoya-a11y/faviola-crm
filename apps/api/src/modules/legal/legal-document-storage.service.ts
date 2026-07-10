import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

interface StoredDocument {
  url: string;
  external: boolean;
}

@Injectable()
export class LegalDocumentStorageService {
  private readonly bucket = process.env.DOCUMENTS_S3_BUCKET ?? process.env.AWS_S3_BUCKET;
  private readonly region = process.env.AWS_REGION ?? 'us-east-1';
  private readonly publicUrl = process.env.DOCUMENTS_PUBLIC_URL ?? process.env.AWS_S3_PUBLIC_URL;
  private readonly endpoint = process.env.DOCUMENTS_S3_ENDPOINT;

  async store(input: {
    tenantId: string;
    propertyId: string;
    name: string;
    source: string;
  }): Promise<StoredDocument> {
    const parsed = parseDataUri(input.source);
    if (!parsed || !this.bucket || !this.publicUrl) {
      return { url: input.source, external: false };
    }

    const key = [
      'legal-documents',
      input.tenantId,
      input.propertyId,
      `${Date.now()}-${safeFilename(input.name)}`,
    ].join('/');

    const client = new S3Client({
      region: this.region,
      endpoint: this.endpoint,
      forcePathStyle: Boolean(this.endpoint),
    });

    await client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: parsed.buffer,
        ContentType: parsed.contentType,
      }),
    );

    return {
      url: `${this.publicUrl.replace(/\/$/, '')}/${key}`,
      external: true,
    };
  }
}

function parseDataUri(value: string): { contentType: string; buffer: Buffer } | null {
  const match = /^data:([^;,]+);base64,(.+)$/s.exec(value);
  if (!match) return null;
  return {
    contentType: match[1] ?? 'application/octet-stream',
    buffer: Buffer.from(match[2] ?? '', 'base64'),
  };
}

function safeFilename(value: string): string {
  const clean = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120);
  return clean || 'documento';
}
