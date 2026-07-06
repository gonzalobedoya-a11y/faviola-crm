import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import type { CreateVisitDto, ListVisitsDto, UpdateVisitDto } from './dto/visit.dto';

const visitInclude = {
  client: { select: { id: true, firstName: true, lastName: true, phone: true } },
  property: { select: { id: true, title: true, district: true } },
} satisfies Prisma.VisitInclude;

@Injectable()
export class VisitsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(tenantId: string, query: ListVisitsDto) {
    const where: Prisma.VisitWhereInput = { tenantId };
    if (query.status) where.status = query.status;
    if (query.from || query.to) {
      where.scheduledAt = { gte: query.from, lte: query.to };
    }
    return this.prisma.visit.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: visitInclude,
      take: 200,
    });
  }

  async create(tenantId: string, agentId: string, dto: CreateVisitDto) {
    return this.prisma.visit.create({
      data: { ...dto, tenantId, agentId },
      include: visitInclude,
    });
  }

  async get(tenantId: string, id: string) {
    const visit = await this.prisma.visit.findFirst({
      where: { id, tenantId },
      include: visitInclude,
    });
    if (!visit) throw new NotFoundException('Visita no encontrada');
    return visit;
  }

  async update(tenantId: string, id: string, dto: UpdateVisitDto) {
    await this.getOrThrow(tenantId, id);
    return this.prisma.visit.update({ where: { id }, data: dto, include: visitInclude });
  }

  private async getOrThrow(tenantId: string, id: string) {
    const visit = await this.prisma.visit.findFirst({ where: { id, tenantId } });
    if (!visit) throw new NotFoundException('Visita no encontrada');
    return visit;
  }
}
