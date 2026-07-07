import { Injectable, NotFoundException } from '@nestjs/common';
import { type ClientRequirement, Prisma, type Property } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import type { ListMatchesDto, UpdateMatchDto } from './dto/matching.dto';

const THRESHOLD = 40;

interface ScoreResult {
  score: number;
  reasons: string[];
}

@Injectable()
export class MatchingService {
  constructor(private readonly prisma: PrismaService) {}

  /** Puntúa (0-100) una propiedad contra los requisitos de un comprador. */
  private score(req: ClientRequirement, property: Property): ScoreResult {
    let score = 0;
    const reasons: string[] = [];

    // Presupuesto (35)
    const max = req.budgetMax ?? undefined;
    const min = req.budgetMin ?? undefined;
    if (
      max === undefined ||
      (property.price <= max && (min === undefined || property.price >= min))
    ) {
      score += 35;
      reasons.push('Dentro del presupuesto');
    } else if (property.price <= Math.round(max * 1.1)) {
      score += 18;
      reasons.push('Ligeramente sobre el presupuesto');
    }

    // Zona (25)
    const district = property.district;
    if (req.zones.length === 0) {
      score += 12;
    } else if (
      district &&
      req.zones.some((zone) => zone.toLowerCase() === district.toLowerCase())
    ) {
      score += 25;
      reasons.push(`Zona: ${district}`);
    }

    // Dormitorios (15)
    if (req.bedroomsMin === null) {
      score += 8;
    } else if (property.bedrooms !== null && property.bedrooms >= req.bedroomsMin) {
      score += 15;
      reasons.push(`${req.bedroomsMin}+ dormitorios`);
    }

    // Baños (10)
    if (req.bathroomsMin === null) {
      score += 5;
    } else if (property.bathrooms !== null && property.bathrooms >= req.bathroomsMin) {
      score += 10;
      reasons.push(`${req.bathroomsMin}+ baños`);
    }

    // Área (10)
    if (req.areaMin === null) {
      score += 5;
    } else if (property.area !== null && property.area >= req.areaMin) {
      score += 10;
      reasons.push(`${req.areaMin}+ m²`);
    }

    // Tipo (5)
    if (req.propertyType === null) {
      score += 3;
    } else if (
      property.propertyType &&
      property.propertyType.toLowerCase() === req.propertyType.toLowerCase()
    ) {
      score += 5;
      reasons.push(property.propertyType);
    }

    return { score: Math.min(100, score), reasons };
  }

  private async upsertOrClear(
    tenantId: string,
    clientId: string,
    propertyId: string,
    result: ScoreResult,
  ): Promise<boolean> {
    if (result.score >= THRESHOLD) {
      await this.prisma.match.upsert({
        where: { clientId_propertyId: { clientId, propertyId } },
        create: { tenantId, clientId, propertyId, score: result.score, reasons: result.reasons },
        update: { score: result.score, reasons: result.reasons },
      });
      return true;
    }
    // Bajó del umbral: elimina la coincidencia si aún no se actuó sobre ella.
    await this.prisma.match.deleteMany({ where: { clientId, propertyId, status: 'NEW' } });
    return false;
  }

  async recomputeForClient(tenantId: string, clientId: string): Promise<number> {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId, deletedAt: null },
      include: { requirement: true },
    });
    if (!client?.requirement) return 0;

    const properties = await this.prisma.property.findMany({
      where: {
        tenantId,
        deletedAt: null,
        status: 'AVAILABLE',
        operation: client.requirement.operation,
      },
    });

    let count = 0;
    for (const property of properties) {
      const created = await this.upsertOrClear(
        tenantId,
        clientId,
        property.id,
        this.score(client.requirement, property),
      );
      if (created) count += 1;
    }
    return count;
  }

  async recomputeForProperty(tenantId: string, propertyId: string): Promise<number> {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, tenantId, deletedAt: null },
    });
    if (!property || property.status !== 'AVAILABLE') return 0;

    const buyers = await this.prisma.client.findMany({
      where: {
        tenantId,
        deletedAt: null,
        type: { in: ['BUYER', 'BOTH'] },
        requirement: { operation: property.operation },
      },
      include: { requirement: true },
    });

    let count = 0;
    for (const buyer of buyers) {
      if (!buyer.requirement) continue;
      const created = await this.upsertOrClear(
        tenantId,
        buyer.id,
        propertyId,
        this.score(buyer.requirement, property),
      );
      if (created) count += 1;
    }
    return count;
  }

  async recomputeAll(tenantId: string): Promise<number> {
    const clients = await this.prisma.client.findMany({
      where: { tenantId, deletedAt: null, requirement: { isNot: null } },
      select: { id: true },
    });
    let total = 0;
    for (const client of clients) {
      total += await this.recomputeForClient(tenantId, client.id);
    }
    return total;
  }

  async list(tenantId: string, query: ListMatchesDto) {
    const { minScore, status, clientId, propertyId, page, pageSize } = query;
    const where: Prisma.MatchWhereInput = { tenantId };
    if (minScore !== undefined) where.score = { gte: minScore };
    if (status) where.status = status;
    if (clientId) where.clientId = clientId;
    if (propertyId) where.propertyId = propertyId;

    const [items, total] = await this.prisma.$transaction([
      this.prisma.match.findMany({
        where,
        orderBy: { score: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          client: {
            select: { id: true, firstName: true, lastName: true, phone: true, temperature: true },
          },
          property: {
            select: {
              id: true,
              title: true,
              price: true,
              currency: true,
              district: true,
              media: { where: { isCover: true }, take: 1, select: { url: true } },
            },
          },
        },
      }),
      this.prisma.match.count({ where }),
    ]);

    return {
      items,
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    };
  }

  async updateStatus(tenantId: string, id: string, dto: UpdateMatchDto) {
    const match = await this.prisma.match.findFirst({ where: { id, tenantId } });
    if (!match) throw new NotFoundException('Coincidencia no encontrada');
    return this.prisma.match.update({ where: { id }, data: { status: dto.status } });
  }

  async clear(tenantId: string): Promise<{ deleted: number }> {
    const result = await this.prisma.match.deleteMany({ where: { tenantId } });
    return { deleted: result.count };
  }
}
