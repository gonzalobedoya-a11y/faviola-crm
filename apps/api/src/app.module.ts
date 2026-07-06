import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerModule } from 'nestjs-pino';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { DealsModule } from './modules/deals/deals.module';
import { HealthModule } from './modules/health/health.module';
import { MatchingModule } from './modules/matching/matching.module';
import { PropertiesModule } from './modules/properties/properties.module';
import { VisitsModule } from './modules/visits/visits.module';

/**
 * Módulo raíz. Sprint 0B: infraestructura transversal + estructura modular.
 * Los módulos de dominio (Auth, Clients, Properties, ...) se registran a
 * partir del Sprint 1 (Blueprint §5).
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL ?? 'info',
        autoLogging: true,
        redact: ['req.headers.authorization', 'req.headers.cookie'],
        transport:
          process.env.NODE_ENV === 'production'
            ? undefined
            : { target: 'pino-pretty', options: { singleLine: true } },
      },
    }),
    PrismaModule,
    AuthModule,
    ClientsModule,
    PropertiesModule,
    MatchingModule,
    DealsModule,
    VisitsModule,
    DashboardModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_INTERCEPTOR, useClass: TransformInterceptor },
    // Orden importante: primero autentica (JWT), luego autoriza (permisos).
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
