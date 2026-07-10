import { Injectable, NotFoundException } from '@nestjs/common';
import type { LegalDocType } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';

import type { AddDocumentDto, UpdateLegalDto } from './dto/legal.dto';

/** Tipos obligatorios para dar el expediente por completo (OTROS es opcional). */
const REQUIRED_TYPES: LegalDocType[] = [
  'TITULO_DOMINIO',
  'PARTIDA',
  'DNI',
  'ESTUDIO_TITULO',
  'CORRETAJE',
];

type DossierStatus = 'PENDIENTE' | 'EN_PROCESO' | 'COMPLETADO' | 'CANCELADO';

@Injectable()
export class LegalService {
  constructor(private readonly prisma: PrismaService) {}

  /** Expedientes de todas las propiedades activas, con estado calculado. */
  async overview(tenantId: string) {
    const properties = await this.prisma.property.findMany({
      where: { tenantId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        code: true,
        title: true,
        propertyType: true,
        address: true,
        district: true,
        legal: true,
        documents: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, type: true, name: true, createdAt: true },
        },
      },
    });

    const items = properties.map((p) => {
      const types = new Set(p.documents.map((d) => d.type));
      const status = this.status(Boolean(p.legal?.cancelled), types);
      return {
        property: {
          id: p.id,
          code: p.code,
          title: p.title,
          propertyType: p.propertyType,
          address: p.address,
          district: p.district,
        },
        legal: {
          contract: p.legal?.contract ?? 'EXCLUSIVO',
          corretajeExpiry: p.legal?.corretajeExpiry ?? null,
          cancelled: p.legal?.cancelled ?? false,
          notes: p.legal?.notes ?? null,
        },
        documents: p.documents,
        status,
      };
    });

    const counts: Record<DossierStatus, number> = {
      PENDIENTE: 0,
      EN_PROCESO: 0,
      COMPLETADO: 0,
      CANCELADO: 0,
    };
    for (const item of items) counts[item.status] += 1;

    return {
      items,
      counts,
      exclusiveCount: items.filter((i) => i.legal.contract === 'EXCLUSIVO').length,
    };
  }

  async addDocument(tenantId: string, propertyId: string, dto: AddDocumentDto) {
    await this.getPropertyOrThrow(tenantId, propertyId);
    return this.prisma.propertyDocument.create({
      data: { tenantId, propertyId, type: dto.type, name: dto.name, url: dto.url },
      select: { id: true, type: true, name: true, createdAt: true },
    });
  }

  /** Contenido del documento (data URI o URL) — se pide bajo demanda por su peso. */
  async getDocument(tenantId: string, propertyId: string, docId: string) {
    const doc = await this.prisma.propertyDocument.findFirst({
      where: { id: docId, propertyId, tenantId },
    });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    return doc;
  }

  async removeDocument(tenantId: string, propertyId: string, docId: string): Promise<void> {
    const doc = await this.prisma.propertyDocument.findFirst({
      where: { id: docId, propertyId, tenantId },
      select: { id: true },
    });
    if (!doc) throw new NotFoundException('Documento no encontrado');
    await this.prisma.propertyDocument.delete({ where: { id: docId } });
  }

  async updateLegal(tenantId: string, propertyId: string, dto: UpdateLegalDto) {
    await this.getPropertyOrThrow(tenantId, propertyId);
    const data = {
      contract: dto.contract,
      corretajeExpiry: dto.corretajeExpiry === undefined ? undefined : dto.corretajeExpiry,
      cancelled: dto.cancelled,
      notes: dto.notes === undefined ? undefined : dto.notes,
    };
    return this.prisma.propertyLegal.upsert({
      where: { propertyId },
      create: {
        tenantId,
        propertyId,
        contract: dto.contract ?? 'EXCLUSIVO',
        corretajeExpiry: dto.corretajeExpiry ?? null,
        cancelled: dto.cancelled ?? false,
        notes: dto.notes ?? null,
      },
      update: data,
    });
  }

  private status(cancelled: boolean, types: Set<LegalDocType>): DossierStatus {
    if (cancelled) return 'CANCELADO';
    if (REQUIRED_TYPES.every((t) => types.has(t))) return 'COMPLETADO';
    if (types.size > 0) return 'EN_PROCESO';
    return 'PENDIENTE';
  }

  private async getPropertyOrThrow(tenantId: string, id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, tenantId, deletedAt: null },
      select: { id: true },
    });
    if (!property) throw new NotFoundException('Propiedad no encontrada');
    return property;
  }
}
