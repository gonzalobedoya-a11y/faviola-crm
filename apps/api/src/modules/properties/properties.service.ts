import { randomBytes } from 'node:crypto';

import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from '../../database/prisma.service';
import { MatchingService } from '../matching/matching.service';
import { StorageService } from '../storage/storage.service';

import type {
  AddMediaDto,
  CreatePropertyDto,
  ListPropertiesDto,
  ReorderMediaDto,
  UpdatePropertyDto,
  UploadUrlDto,
} from './dto/property.dto';

@Injectable()
export class PropertiesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matching: MatchingService,
    private readonly storage: StorageService,
  ) {}

  async getUploadUrl(tenantId: string, id: string, dto: UploadUrlDto) {
    await this.getOrThrow(tenantId, id);
    return this.storage.presignUpload(`properties/${id}`, dto.filename, dto.contentType);
  }

  async list(tenantId: string, query: ListPropertiesDto) {
    const { operation, status, district, q, priceMin, priceMax, page, pageSize } = query;
    const where: Prisma.PropertyWhereInput = { tenantId, deletedAt: null };

    if (operation) where.operation = operation;
    if (status) where.status = status;
    if (district) where.district = { contains: district, mode: 'insensitive' };
    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = { gte: priceMin, lte: priceMax };
    }
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { code: { contains: q, mode: 'insensitive' } },
        { district: { contains: q, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.property.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          media: { orderBy: [{ isCover: 'desc' }, { order: 'asc' }] },
          owner: { select: { id: true, firstName: true, lastName: true, phone: true } },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      items,
      meta: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    };
  }

  async create(tenantId: string, agentId: string, dto: CreatePropertyDto) {
    const { images, ...rest } = dto;
    const property = await this.prisma.property.create({
      data: {
        ...rest,
        tenantId,
        agentId,
        code: `FV-${randomBytes(3).toString('hex').toUpperCase()}`,
        publishedAt: rest.status === 'AVAILABLE' ? new Date() : null,
        media: images?.length
          ? {
              create: images.map((url, index) => ({
                url,
                order: index,
                isCover: index === 0,
              })),
            }
          : undefined,
      },
      include: {
        media: { orderBy: [{ isCover: 'desc' }, { order: 'asc' }] },
        owner: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });

    // Matching inverso: al publicar una propiedad, busca compradores que encajen.
    await this.matching.recomputeForProperty(tenantId, property.id).catch(() => undefined);
    return property;
  }

  async get(tenantId: string, id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        media: { orderBy: [{ isCover: 'desc' }, { order: 'asc' }] },
        owner: { select: { id: true, firstName: true, lastName: true, phone: true } },
        agent: { select: { firstName: true, lastName: true } },
      },
    });
    if (!property) throw new NotFoundException('Propiedad no encontrada');
    return property;
  }

  async getPublicByCode(code: string) {
    const property = await this.prisma.property.findFirst({
      where: { code, deletedAt: null, status: 'AVAILABLE' },
      include: {
        media: { where: { type: 'IMAGE' }, orderBy: [{ isCover: 'desc' }, { order: 'asc' }] },
        agent: { select: { firstName: true, lastName: true, phone: true } },
      },
    });
    if (!property) throw new NotFoundException('Propiedad no encontrada');
    return property;
  }

  async update(tenantId: string, id: string, dto: UpdatePropertyDto) {
    await this.getOrThrow(tenantId, id);
    return this.prisma.property.update({
      where: { id },
      data: dto,
      include: { media: { orderBy: [{ isCover: 'desc' }, { order: 'asc' }] } },
    });
  }

  async remove(tenantId: string, id: string): Promise<void> {
    await this.getOrThrow(tenantId, id);
    await this.prisma.property.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async addMedia(tenantId: string, id: string, dto: AddMediaDto) {
    await this.getOrThrow(tenantId, id);
    if (dto.isCover) {
      await this.prisma.propertyMedia.updateMany({
        where: { propertyId: id },
        data: { isCover: false },
      });
    }
    const count = await this.prisma.propertyMedia.count({ where: { propertyId: id } });
    return this.prisma.propertyMedia.create({
      data: { propertyId: id, url: dto.url, type: dto.type, isCover: dto.isCover, order: count },
    });
  }

  async removeMedia(tenantId: string, id: string, mediaId: string): Promise<void> {
    await this.getOrThrow(tenantId, id);
    await this.prisma.propertyMedia.deleteMany({ where: { id: mediaId, propertyId: id } });
  }

  async setCover(tenantId: string, id: string, mediaId: string) {
    await this.getOrThrow(tenantId, id);
    await this.prisma.propertyMedia.updateMany({
      where: { propertyId: id },
      data: { isCover: false },
    });
    return this.prisma.propertyMedia.update({ where: { id: mediaId }, data: { isCover: true } });
  }

  async reorderMedia(tenantId: string, id: string, dto: ReorderMediaDto) {
    await this.getOrThrow(tenantId, id);
    const existing = await this.prisma.propertyMedia.findMany({
      where: { propertyId: id, id: { in: dto.mediaIds } },
      select: { id: true },
    });
    if (existing.length !== dto.mediaIds.length) {
      throw new NotFoundException('Una o más imágenes no pertenecen a la propiedad');
    }

    await this.prisma.$transaction(
      dto.mediaIds.map((mediaId, index) =>
        this.prisma.propertyMedia.update({ where: { id: mediaId }, data: { order: index } }),
      ),
    );

    return this.get(tenantId, id);
  }

  private async getOrThrow(tenantId: string, id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, tenantId, deletedAt: null },
    });
    if (!property) throw new NotFoundException('Propiedad no encontrada');
    return property;
  }
}
