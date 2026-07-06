import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { Public } from '../../common/decorators/public.decorator';
import { PrismaService } from '../../database/prisma.service';

interface HealthStatus {
  status: 'ok' | 'degraded';
  service: string;
  version: string;
  database: 'up' | 'down';
  timestamp: string;
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOkResponse({ description: 'Estado del servicio y de sus dependencias.' })
  async check(): Promise<HealthStatus> {
    let database: 'up' | 'down' = 'up';
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      database = 'down';
    }

    return {
      status: database === 'up' ? 'ok' : 'degraded',
      service: 'faviola-api',
      version: process.env.npm_package_version ?? '0.0.0',
      database,
      timestamp: new Date().toISOString(),
    };
  }
}
