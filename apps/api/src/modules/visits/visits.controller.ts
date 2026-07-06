import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../auth/auth.types';

import {
  type CreateVisitDto,
  createVisitSchema,
  type ListVisitsDto,
  listVisitsSchema,
  type UpdateVisitDto,
  updateVisitSchema,
} from './dto/visit.dto';
import { VisitsService } from './visits.service';

@ApiTags('visits')
@ApiBearerAuth()
@Controller('visits')
export class VisitsController {
  constructor(private readonly visits: VisitsService) {}

  @Get()
  @RequirePermissions('visits.read')
  list(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(listVisitsSchema)) query: ListVisitsDto,
  ) {
    return this.visits.list(user.tenantId, query);
  }

  @Post()
  @RequirePermissions('visits.create')
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createVisitSchema)) dto: CreateVisitDto,
  ) {
    return this.visits.create(user.tenantId, user.sub, dto);
  }

  @Get(':id')
  @RequirePermissions('visits.read')
  get(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.visits.get(user.tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions('visits.update')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateVisitSchema)) dto: UpdateVisitDto,
  ) {
    return this.visits.update(user.tenantId, id, dto);
  }
}
