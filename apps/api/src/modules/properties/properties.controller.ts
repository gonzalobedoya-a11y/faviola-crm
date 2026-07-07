import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../auth/auth.types';

import {
  type AddMediaDto,
  addMediaSchema,
  type CreatePropertyDto,
  createPropertySchema,
  type ListPropertiesDto,
  listPropertiesSchema,
  type ReorderMediaDto,
  reorderMediaSchema,
  type UpdatePropertyDto,
  updatePropertySchema,
  type UploadUrlDto,
  uploadUrlSchema,
} from './dto/property.dto';
import { PropertiesService } from './properties.service';

@ApiTags('properties')
@ApiBearerAuth()
@Controller('properties')
export class PropertiesController {
  constructor(private readonly properties: PropertiesService) {}

  @Get()
  @RequirePermissions('properties.read')
  list(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(listPropertiesSchema)) query: ListPropertiesDto,
  ) {
    return this.properties.list(user.tenantId, query);
  }

  @Post()
  @RequirePermissions('properties.create')
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createPropertySchema)) dto: CreatePropertyDto,
  ) {
    return this.properties.create(user.tenantId, user.sub, dto);
  }

  @Public()
  @Get('public/:code')
  getPublic(@Param('code') code: string) {
    return this.properties.getPublicByCode(code);
  }

  @Get(':id')
  @RequirePermissions('properties.read')
  get(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.properties.get(user.tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions('properties.update')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updatePropertySchema)) dto: UpdatePropertyDto,
  ) {
    return this.properties.update(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('properties.delete')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.properties.remove(user.tenantId, id);
  }

  @Post(':id/media/upload-url')
  @RequirePermissions('properties.update')
  getUploadUrl(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(uploadUrlSchema)) dto: UploadUrlDto,
  ) {
    return this.properties.getUploadUrl(user.tenantId, id, dto);
  }

  @Post(':id/media')
  @RequirePermissions('properties.update')
  addMedia(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addMediaSchema)) dto: AddMediaDto,
  ) {
    return this.properties.addMedia(user.tenantId, id, dto);
  }

  @Put(':id/media/:mediaId/cover')
  @RequirePermissions('properties.update')
  setCover(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this.properties.setCover(user.tenantId, id, mediaId);
  }

  @Patch(':id/media/order')
  @RequirePermissions('properties.update')
  reorderMedia(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(reorderMediaSchema)) dto: ReorderMediaDto,
  ) {
    return this.properties.reorderMedia(user.tenantId, id, dto);
  }

  @Delete(':id/media/:mediaId')
  @RequirePermissions('properties.update')
  removeMedia(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Param('mediaId') mediaId: string,
  ) {
    return this.properties.removeMedia(user.tenantId, id, mediaId);
  }
}
