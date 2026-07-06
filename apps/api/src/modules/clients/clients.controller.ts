import { Body, Controller, Delete, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../auth/auth.types';

import { ClientsService } from './clients.service';
import {
  type AddActivityDto,
  addActivitySchema,
  type CreateClientDto,
  createClientSchema,
  type ListClientsDto,
  listClientsSchema,
  type RequirementDto,
  requirementSchema,
  type UpdateClientDto,
  updateClientSchema,
} from './dto/client.dto';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  @RequirePermissions('clients.read')
  list(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(listClientsSchema)) query: ListClientsDto,
  ) {
    return this.clients.list(user.tenantId, query);
  }

  @Post()
  @RequirePermissions('clients.create')
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createClientSchema)) dto: CreateClientDto,
  ) {
    return this.clients.create(user.tenantId, user.sub, dto);
  }

  @Get(':id')
  @RequirePermissions('clients.read')
  get(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.clients.get(user.tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions('clients.update')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateClientSchema)) dto: UpdateClientDto,
  ) {
    return this.clients.update(user.tenantId, id, user.sub, dto);
  }

  @Delete(':id')
  @RequirePermissions('clients.delete')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.clients.remove(user.tenantId, id);
  }

  @Get(':id/timeline')
  @RequirePermissions('clients.read')
  timeline(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.clients.timeline(user.tenantId, id);
  }

  @Put(':id/requirement')
  @RequirePermissions('clients.update')
  upsertRequirement(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(requirementSchema)) dto: RequirementDto,
  ) {
    return this.clients.upsertRequirement(user.tenantId, id, dto);
  }

  @Post(':id/activities')
  @RequirePermissions('clients.update')
  addActivity(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addActivitySchema)) dto: AddActivityDto,
  ) {
    return this.clients.addActivity(user.tenantId, id, user.sub, dto);
  }
}
