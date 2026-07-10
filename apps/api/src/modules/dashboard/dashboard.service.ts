import { Injectable } from '@nestjs/common';

import { nextBirthday } from '../../common/utils/birthday';
import { PrismaService } from '../../database/prisma.service';

const ACTIVE_STAGES = ['NEW', 'CONTACTED', 'VISIT', 'OFFER', 'NEGOTIATION', 'CLOSING'] as const;

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(tenantId: string) {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date(startOfToday);
    endOfToday.setDate(endOfToday.getDate() + 1);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      clientsCount,
      ownersCount,
      propertiesCount,
      availableProperties,
      documentsCount,
      matchesCount,
      dealsAgg,
      followUps,
      newMatchesCount,
      visitsToday,
      overdueVisits,
      dealsClosing,
      hotClients,
      agendaVisits,
      topMatches,
      pipelineGroups,
      recentActivity,
      clientsNew,
      propertiesNew,
      matchesNew,
      birthdayClients,
    ] = await Promise.all([
      this.prisma.client.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.client.count({
        where: { tenantId, deletedAt: null, type: { in: ['SELLER', 'BOTH'] } },
      }),
      this.prisma.property.count({ where: { tenantId, deletedAt: null } }),
      this.prisma.property.count({
        where: { tenantId, deletedAt: null, status: 'AVAILABLE' },
      }),
      this.prisma.propertyMedia.count({
        where: { type: 'DOC', property: { tenantId, deletedAt: null } },
      }),
      this.prisma.match.count({ where: { tenantId } }),
      this.prisma.deal.aggregate({
        where: { tenantId, deletedAt: null, stage: { in: [...ACTIVE_STAGES] } },
        _count: true,
        _sum: { value: true },
      }),
      this.prisma.client.count({
        where: {
          tenantId,
          deletedAt: null,
          OR: [{ lastContactAt: null }, { lastContactAt: { lt: sevenDaysAgo } }],
        },
      }),
      this.prisma.match.count({ where: { tenantId, status: 'NEW' } }),
      this.prisma.visit.count({
        where: {
          tenantId,
          status: 'SCHEDULED',
          scheduledAt: { gte: startOfToday, lt: endOfToday },
        },
      }),
      this.prisma.visit.count({
        where: { tenantId, status: 'SCHEDULED', scheduledAt: { lt: now } },
      }),
      this.prisma.deal.count({ where: { tenantId, deletedAt: null, stage: 'CLOSING' } }),
      this.prisma.client.count({
        where: { tenantId, deletedAt: null, temperature: 'HOT' },
      }),
      this.prisma.visit.findMany({
        where: { tenantId, scheduledAt: { gte: startOfToday, lt: endOfToday } },
        orderBy: { scheduledAt: 'asc' },
        take: 8,
        include: {
          client: { select: { firstName: true, lastName: true } },
          property: { select: { title: true } },
        },
      }),
      this.prisma.match.findMany({
        where: { tenantId, status: 'NEW' },
        orderBy: { score: 'desc' },
        take: 5,
        include: {
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
        },
      }),
      this.prisma.deal.groupBy({
        by: ['stage'],
        where: { tenantId, deletedAt: null },
        _count: { _all: true },
        _sum: { value: true },
      }),
      this.prisma.activityLog.findMany({
        where: { tenantId },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { client: { select: { firstName: true, lastName: true } } },
      }),
      this.prisma.client.count({
        where: { tenantId, deletedAt: null, createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.property.count({
        where: { tenantId, deletedAt: null, createdAt: { gte: sevenDaysAgo } },
      }),
      this.prisma.match.count({ where: { tenantId, createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.client.findMany({
        where: { tenantId, deletedAt: null, birthday: { not: null } },
        select: { id: true, firstName: true, lastName: true, phone: true, birthday: true },
      }),
    ]);

    const nextActions = this.buildNextActions(topMatches, followUps, dealsClosing);

    // Cumpleaños dentro de los próximos 7 días (incluye hoy).
    const birthdays = birthdayClients
      .map((client) => {
        const next = nextBirthday(client.birthday as Date);
        return {
          id: client.id,
          name: `${client.firstName} ${client.lastName}`,
          phone: client.phone,
          date: next.date,
          daysUntil: next.daysUntil,
          turns: next.turns,
        };
      })
      .filter((b) => b.daysUntil <= 7)
      .sort((a, b) => a.daysUntil - b.daysUntil)
      .slice(0, 6);

    return {
      counts: {
        clients: clientsCount,
        owners: ownersCount,
        properties: propertiesCount,
        availableProperties,
        documents: documentsCount,
        matches: matchesCount,
        deals: dealsAgg._count,
        pipelineValue: dealsAgg._sum.value ?? 0,
      },
      deltas: {
        clients: clientsNew,
        properties: propertiesNew,
        matches: matchesNew,
      },
      quickStats: {
        followUps,
        newMatches: newMatchesCount,
        visitsToday,
        overdueVisits,
        dealsClosing,
        hotClients,
      },
      agenda: agendaVisits.map((visit) => ({
        id: visit.id,
        time: visit.scheduledAt,
        client: `${visit.client.firstName} ${visit.client.lastName}`,
        property: visit.property?.title ?? null,
      })),
      matches: topMatches.map((match) => ({
        id: match.id,
        score: match.score,
        clientId: match.client.id,
        client: `${match.client.firstName} ${match.client.lastName}`,
        propertyId: match.property.id,
        property: match.property.title,
        price: match.property.price,
        currency: match.property.currency,
        cover: match.property.media[0]?.url ?? null,
      })),
      pipeline: ACTIVE_STAGES.map((stage) => {
        const group = pipelineGroups.find((g) => g.stage === stage);
        return { stage, count: group?._count._all ?? 0, total: group?._sum.value ?? 0 };
      }),
      activity: recentActivity.map((entry) => ({
        id: entry.id,
        type: entry.type,
        message: entry.message,
        client: entry.client ? `${entry.client.firstName} ${entry.client.lastName}` : null,
        createdAt: entry.createdAt,
      })),
      nextActions,
      birthdays,
    };
  }

  private buildNextActions(
    topMatches: Array<{
      score: number;
      client: { firstName: string; lastName: string };
      property: { title: string };
    }>,
    followUps: number,
    dealsClosing: number,
  ): Array<{ title: string; detail: string }> {
    const actions: Array<{ title: string; detail: string }> = [];

    const best = topMatches[0];
    if (best) {
      actions.push({
        title: `Contacta a ${best.client.firstName} ${best.client.lastName}`,
        detail: `Coincide ${best.score}% con "${best.property.title}". Envíale la propiedad.`,
      });
    }
    if (dealsClosing > 0) {
      actions.push({
        title: `${dealsClosing} negociación${dealsClosing === 1 ? '' : 'es'} por cerrar`,
        detail: 'Revisa la documentación y avanza al cierre.',
      });
    }
    if (followUps > 0) {
      actions.push({
        title: `${followUps} cliente${followUps === 1 ? '' : 's'} esperan seguimiento`,
        detail: 'Retómalos antes de que se enfríen.',
      });
    }
    return actions.slice(0, 3);
  }
}
