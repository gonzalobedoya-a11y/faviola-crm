import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { nextBirthday } from '../../common/utils/birthday';
import { PrismaService } from '../../database/prisma.service';
import { MatchingService } from '../matching/matching.service';

import type {
  AddActivityDto,
  CreateClientDto,
  ListClientsDto,
  PublicLeadDto,
  RequirementDto,
  UpdateClientDto,
} from './dto/client.dto';

@Injectable()
export class ClientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matching: MatchingService,
  ) {}

  async list(tenantId: string, query: ListClientsDto) {
    const { type, temperature, q, page, pageSize } = query;
    const where: Prisma.ClientWhereInput = { tenantId, deletedAt: null };

    if (type === 'BUYER') where.type = { in: ['BUYER', 'BOTH'] };
    if (type === 'SELLER') where.type = { in: ['SELLER', 'BOTH'] };
    if (temperature) where.temperature = temperature;
    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
        { phone: { contains: q } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.client.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { requirement: true },
      }),
      this.prisma.client.count({ where }),
    ]);

    return {
      items,
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    };
  }

  async create(tenantId: string, ownerId: string, dto: CreateClientDto) {
    const { requirement, email, ...rest } = dto;
    const client = await this.prisma.client.create({
      data: {
        ...rest,
        email: email || null,
        tenantId,
        ownerId,
        requirement: requirement ? { create: requirement } : undefined,
        activities: {
          create: {
            tenantId,
            type: 'CREATED',
            message: 'Cliente registrado',
            actorId: ownerId,
          },
        },
      },
      include: { requirement: true },
    });

    // Matching automático al registrar un comprador con requisitos.
    if (requirement) {
      await this.matching.recomputeForClient(tenantId, client.id).catch(() => undefined);
    }
    return client;
  }

  async createPublicLead(dto: PublicLeadDto) {
    const tenant = await this.prisma.tenant.findFirst({
      where: { slug: 'faviola-velarde', deletedAt: null },
      select: { id: true },
    });
    if (!tenant) throw new NotFoundException('Cuenta no disponible');

    const owner = await this.prisma.user.findFirst({
      where: { tenantId: tenant.id, status: 'ACTIVE', deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!owner) throw new NotFoundException('Asesor no disponible');

    const zones = dto.zones.map((zone) => zone.trim()).filter(Boolean);
    const client = await this.create(tenant.id, owner.id, {
      type: 'BUYER',
      firstName: dto.firstName.trim(),
      lastName: dto.lastName?.trim() || 'Lead',
      phone: dto.phone.trim(),
      email: dto.email || undefined,
      source: dto.source || 'Formulario público',
      temperature: 'HOT',
      notes: dto.notes,
      requirement: {
        operation: dto.operation,
        propertyType: dto.propertyType || undefined,
        budgetMax: dto.budgetMax,
        currency: dto.currency,
        bedroomsMin: dto.bedroomsMin,
        zones,
        notes: dto.notes,
      },
    });

    await this.prisma.activityLog.create({
      data: {
        tenantId: tenant.id,
        clientId: client.id,
        type: 'MESSAGE',
        message: `Lead capturado desde ${dto.source || 'formulario público'}`,
        actorId: owner.id,
      },
    });

    return { id: client.id, message: 'Lead recibido. Faviola se pondrá en contacto.' };
  }

  /** Clientes que cumplen años en los próximos `days` días (incluye hoy). */
  async birthdays(tenantId: string, days = 30) {
    const clients = await this.prisma.client.findMany({
      where: { tenantId, deletedAt: null, birthday: { not: null } },
      select: { id: true, firstName: true, lastName: true, phone: true, birthday: true },
    });

    const upcoming = clients
      .map((client) => {
        const next = nextBirthday(client.birthday as Date);
        return { ...client, nextDate: next.date, daysUntil: next.daysUntil, turns: next.turns };
      })
      .filter((c) => c.daysUntil <= days)
      .sort((a, b) => a.daysUntil - b.daysUntil);

    return { items: upcoming };
  }

  /** Plantilla de saludo de cumpleaños (tenant.settings). */
  async getBirthdaySettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    const s = (tenant?.settings ?? {}) as Record<string, unknown>;
    return {
      template:
        typeof s.birthdayTemplate === 'string' && s.birthdayTemplate.trim()
          ? s.birthdayTemplate
          : '¡Feliz cumpleaños, {nombre}! 🎂🎉 Que tengas un día maravilloso rodeado de los tuyos. Un abrazo grande, Faviola Velarde — Asesoría Patrimonial.',
      autoSend: s.birthdayAutoSend === true,
    };
  }

  async updateBirthdaySettings(tenantId: string, dto: { template?: string; autoSend?: boolean }) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { settings: true },
    });
    const settings = { ...((tenant?.settings ?? {}) as Record<string, unknown>) };
    if (dto.template !== undefined) settings.birthdayTemplate = dto.template;
    if (dto.autoSend !== undefined) settings.birthdayAutoSend = dto.autoSend;
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { settings: settings as Prisma.InputJsonObject },
    });
    return this.getBirthdaySettings(tenantId);
  }

  async get(tenantId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        requirement: true,
        activities: { orderBy: { createdAt: 'desc' }, take: 25 },
        owner: { select: { firstName: true, lastName: true } },
      },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }

  async update(tenantId: string, id: string, actorId: string, dto: UpdateClientDto) {
    const existing = await this.getOrThrow(tenantId, id);
    const { email, ...rest } = dto;

    const client = await this.prisma.client.update({
      where: { id },
      data: { ...rest, ...(email !== undefined ? { email: email || null } : {}) },
      include: { requirement: true },
    });

    if (dto.temperature && dto.temperature !== existing.temperature) {
      await this.prisma.activityLog.create({
        data: {
          tenantId,
          clientId: id,
          type: 'STATUS_CHANGE',
          message: `Temperatura: ${existing.temperature} → ${dto.temperature}`,
          actorId,
        },
      });
    }
    return client;
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.getOrThrow(tenantId, id);
    await this.prisma.client.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async timeline(tenantId: string, id: string) {
    await this.getOrThrow(tenantId, id);
    return this.prisma.activityLog.findMany({
      where: { tenantId, clientId: id },
      orderBy: { createdAt: 'desc' },
    });
  }

  async upsertRequirement(tenantId: string, id: string, dto: RequirementDto) {
    await this.getOrThrow(tenantId, id);
    const requirement = await this.prisma.clientRequirement.upsert({
      where: { clientId: id },
      create: { clientId: id, ...dto },
      update: dto,
    });
    await this.matching.recomputeForClient(tenantId, id).catch(() => undefined);
    return requirement;
  }

  async addActivity(tenantId: string, id: string, actorId: string, dto: AddActivityDto) {
    await this.getOrThrow(tenantId, id);
    const [activity] = await this.prisma.$transaction([
      this.prisma.activityLog.create({
        data: { tenantId, clientId: id, type: dto.type, message: dto.message, actorId },
      }),
      this.prisma.client.update({ where: { id }, data: { lastContactAt: new Date() } }),
    ]);
    return activity;
  }

  private async getOrThrow(tenantId: string, id: string) {
    const client = await this.prisma.client.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!client) throw new NotFoundException('Cliente no encontrado');
    return client;
  }
}
