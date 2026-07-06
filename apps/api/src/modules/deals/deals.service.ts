import { Injectable, NotFoundException } from '@nestjs/common';
import { type DealStage, Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import {
  type CloseDealDto,
  type CreateDealDto,
  dealStages,
  type UpdateDealDto,
} from './dto/deal.dto';

const STAGE_PROBABILITY: Record<DealStage, number> = {
  NEW: 10,
  CONTACTED: 25,
  VISIT: 45,
  OFFER: 60,
  NEGOTIATION: 75,
  CLOSING: 90,
  WON: 100,
  LOST: 0,
};

const dealInclude = {
  client: { select: { id: true, firstName: true, lastName: true } },
  property: {
    select: {
      id: true,
      title: true,
      price: true,
      currency: true,
      media: { where: { isCover: true }, take: 1, select: { url: true } },
    },
  },
} satisfies Prisma.DealInclude;

@Injectable()
export class DealsService {
  constructor(private readonly prisma: PrismaService) {}

  async board(tenantId: string) {
    const deals = await this.prisma.deal.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      include: dealInclude,
      take: 300,
    });

    return dealStages.map((stage) => {
      const stageDeals = deals.filter((deal) => deal.stage === stage);
      const total = stageDeals.reduce((sum, deal) => sum + (deal.value ?? 0), 0);
      return { stage, deals: stageDeals, count: stageDeals.length, total };
    });
  }

  async create(tenantId: string, agentId: string, dto: CreateDealDto) {
    const { stage, probability, ...rest } = dto;
    return this.prisma.deal.create({
      data: {
        ...rest,
        tenantId,
        agentId,
        stage,
        probability: probability ?? STAGE_PROBABILITY[stage],
      },
      include: dealInclude,
    });
  }

  async get(tenantId: string, id: string) {
    const deal = await this.prisma.deal.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: dealInclude,
    });
    if (!deal) throw new NotFoundException('Negociación no encontrada');
    return deal;
  }

  async update(tenantId: string, id: string, dto: UpdateDealDto) {
    await this.getOrThrow(tenantId, id);
    return this.prisma.deal.update({ where: { id }, data: dto, include: dealInclude });
  }

  async moveStage(tenantId: string, id: string, stage: DealStage) {
    await this.getOrThrow(tenantId, id);
    const closed = stage === 'WON' || stage === 'LOST';
    return this.prisma.deal.update({
      where: { id },
      data: {
        stage,
        probability: STAGE_PROBABILITY[stage],
        closedAt: closed ? new Date() : null,
      },
      include: dealInclude,
    });
  }

  async close(tenantId: string, id: string, dto: CloseDealDto) {
    await this.getOrThrow(tenantId, id);
    return this.prisma.deal.update({
      where: { id },
      data: {
        stage: dto.result,
        probability: STAGE_PROBABILITY[dto.result],
        closedAt: new Date(),
        lostReason: dto.result === 'LOST' ? (dto.lostReason ?? null) : null,
        commissionAmount: dto.commissionAmount ?? undefined,
      },
      include: dealInclude,
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.getOrThrow(tenantId, id);
    await this.prisma.deal.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  private async getOrThrow(tenantId: string, id: string) {
    const deal = await this.prisma.deal.findFirst({ where: { id, tenantId, deletedAt: null } });
    if (!deal) throw new NotFoundException('Negociación no encontrada');
    return deal;
  }
}
