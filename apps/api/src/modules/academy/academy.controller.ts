import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../auth/auth.types';

import { AcademyService } from './academy.service';
import {
  type CreateAcademyLeadDto,
  createAcademyLeadSchema,
  type CreateAcademyProgramDto,
  createAcademyProgramSchema,
  type CreateAcademyStudentDto,
  createAcademyStudentSchema,
  type PortalAccessDto,
  portalAccessSchema,
  type UpdateAcademyProgramDto,
  updateAcademyProgramSchema,
} from './dto/academy.dto';

@ApiTags('academy')
@ApiBearerAuth()
@Controller('academy')
export class AcademyController {
  constructor(private readonly academy: AcademyService) {}

  @Public()
  @Get('public/programs')
  publicPrograms() {
    return this.academy.publicPrograms();
  }

  @Public()
  @Post('public/leads')
  createPublicLead(
    @Body(new ZodValidationPipe(createAcademyLeadSchema)) dto: CreateAcademyLeadDto,
  ) {
    return this.academy.createPublicLead(dto);
  }

  @Public()
  @Post('portal')
  portal(@Body(new ZodValidationPipe(portalAccessSchema)) dto: PortalAccessDto) {
    return this.academy.portal(dto);
  }

  @Get()
  @RequirePermissions('academy.read')
  dashboard(@CurrentUser() user: JwtPayload) {
    return this.academy.dashboard(user.tenantId);
  }

  @Post('programs')
  @RequirePermissions('academy.create')
  createProgram(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createAcademyProgramSchema)) dto: CreateAcademyProgramDto,
  ) {
    return this.academy.createProgram(user.tenantId, dto);
  }

  @Patch('programs/:id')
  @RequirePermissions('academy.update')
  updateProgram(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateAcademyProgramSchema)) dto: UpdateAcademyProgramDto,
  ) {
    return this.academy.updateProgram(user.tenantId, id, dto);
  }

  @Post('students')
  @RequirePermissions('academy.create')
  createStudent(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(createAcademyStudentSchema)) dto: CreateAcademyStudentDto,
  ) {
    return this.academy.createStudent(user.tenantId, dto);
  }
}
