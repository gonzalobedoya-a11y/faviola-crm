import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../auth/auth.types';

import {
  type ListMatchesDto,
  listMatchesSchema,
  type RunMatchingDto,
  runMatchingSchema,
  type UpdateMatchDto,
  updateMatchSchema,
} from './dto/matching.dto';
import { MatchingService } from './matching.service';

@ApiTags('matching')
@ApiBearerAuth()
@Controller('matches')
export class MatchingController {
  constructor(private readonly matching: MatchingService) {}

  @Get()
  @RequirePermissions('matching.read')
  list(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(listMatchesSchema)) query: ListMatchesDto,
  ) {
    return this.matching.list(user.tenantId, query);
  }

  @Post('run')
  @RequirePermissions('matching.run')
  async run(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(runMatchingSchema)) dto: RunMatchingDto,
  ): Promise<{ matches: number }> {
    let matches: number;
    if (dto.clientId) {
      matches = await this.matching.recomputeForClient(user.tenantId, dto.clientId);
    } else if (dto.propertyId) {
      matches = await this.matching.recomputeForProperty(user.tenantId, dto.propertyId);
    } else {
      matches = await this.matching.recomputeAll(user.tenantId);
    }
    return { matches };
  }

  @Patch(':id')
  @RequirePermissions('matching.read')
  updateStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMatchSchema)) dto: UpdateMatchDto,
  ) {
    return this.matching.updateStatus(user.tenantId, id, dto);
  }
}
