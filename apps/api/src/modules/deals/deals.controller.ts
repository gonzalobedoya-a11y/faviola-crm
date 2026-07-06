import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../auth/auth.types';

import { DealsService } from './deals.service';
import {
  type CloseDealDto,
  closeDealSchema,
  type CreateDealDto,
  createDealSchema,
  type MoveStageDto,
  moveStageSchema,
  type UpdateDealDto,
  updateDealSchema,
} from './dto/deal.dto';

@ApiTags('deals')
@ApiBearerAuth()
@Controller('deals')
export class DealsController {
  constructor(private readonly deals: DealsService) {}

  @Get('board')
  @RequirePermissions('deals.read')
  board(@CurrentUser() user: JwtPayload) {
    return this.deals.board(user.tenantId);
  }

  @Post()
  @RequirePermissions('deals.create')
  create(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createDealSchema)) dto: CreateDealDto,
  ) {
    return this.deals.create(user.tenantId, user.sub, dto);
  }

  @Get(':id')
  @RequirePermissions('deals.read')
  get(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.deals.get(user.tenantId, id);
  }

  @Patch(':id')
  @RequirePermissions('deals.update')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateDealSchema)) dto: UpdateDealDto,
  ) {
    return this.deals.update(user.tenantId, id, dto);
  }

  @Patch(':id/stage')
  @RequirePermissions('deals.update')
  moveStage(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(moveStageSchema)) dto: MoveStageDto,
  ) {
    return this.deals.moveStage(user.tenantId, id, dto.stage);
  }

  @Post(':id/close')
  @RequirePermissions('deals.close')
  close(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(closeDealSchema)) dto: CloseDealDto,
  ) {
    return this.deals.close(user.tenantId, id, dto);
  }

  @Delete(':id')
  @RequirePermissions('deals.update')
  remove(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.deals.remove(user.tenantId, id);
  }
}
