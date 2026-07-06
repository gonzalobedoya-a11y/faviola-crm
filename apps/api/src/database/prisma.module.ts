import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service';

/**
 * Módulo global: expone PrismaService a todo el sistema sin re-importar.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
