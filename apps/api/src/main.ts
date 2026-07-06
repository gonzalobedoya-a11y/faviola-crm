import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module';
import type { Env } from './config/env.validation';

/**
 * Bootstrap del backend (Blueprint §1.4 / §5).
 * - Logger estructurado (pino)
 * - Seguridad por defecto (helmet + CORS restrictivo)
 * - Prefijo versionado `/api/v1`
 * - Documentación OpenAPI en `/api/docs`
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService<Env, true>);
  const isProd = config.get('NODE_ENV', { infer: true }) === 'production';

  // Detrás del proxy de Railway/Vercel: necesario para cookies `Secure`.
  if (isProd) {
    (app.getHttpAdapter().getInstance() as { set: (k: string, v: unknown) => void }).set(
      'trust proxy',
      1,
    );
  }

  app.use(helmet());
  app.use(cookieParser());
  // CORS: admite varios orígenes separados por coma (p. ej. dominios de Vercel).
  const origins = config
    .get('CORS_ORIGIN', { infer: true })
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: origins, credentials: true });
  app.setGlobalPrefix('api/v1');
  app.enableShutdownHooks();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Faviola Velarde CRM API')
    .setDescription('API del CRM inmobiliario inteligente')
    .setVersion('v1')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = Number(process.env.PORT ?? config.get('API_PORT', { infer: true }));
  await app.listen(port, '0.0.0.0');

  app.get(Logger).log(`API operativa en el puerto ${port} (/api/v1/health)`);
}

void bootstrap();
