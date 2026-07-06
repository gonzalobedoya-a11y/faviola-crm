import { z } from 'zod';

/**
 * Esquema único de variables de entorno (validación en el arranque).
 * Si algo falta o es inválido, la app no levanta — "fail fast".
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL es obligatoria'),
  REDIS_URL: z.string().optional(),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  JWT_ACCESS_SECRET: z.string().min(1).default('change-me-access-secret'),
  JWT_REFRESH_SECRET: z.string().min(1).default('change-me-refresh-secret'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('7d'),

  // Almacenamiento (MinIO / S3)
  MINIO_ENDPOINT: z.string().default('http://localhost:9000'),
  MINIO_PUBLIC_URL: z.string().default('http://localhost:9000'),
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin'),
  MINIO_BUCKET: z.string().default('faviola'),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Variables de entorno inválidas:\n${detail}`);
  }
  if (
    parsed.data.NODE_ENV === 'production' &&
    (parsed.data.JWT_ACCESS_SECRET === 'change-me-access-secret' ||
      parsed.data.JWT_REFRESH_SECRET === 'change-me-refresh-secret')
  ) {
    throw new Error('JWT_ACCESS_SECRET y JWT_REFRESH_SECRET deben configurarse en producción');
  }
  return parsed.data;
}
