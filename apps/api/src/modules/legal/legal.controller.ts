import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../auth/auth.types';

import {
  type AddDocumentDto,
  addDocumentSchema,
  type UpdateLegalDto,
  updateLegalSchema,
} from './dto/legal.dto';
import { LegalService } from './legal.service';

@ApiTags('legal')
@ApiBearerAuth()
@Controller('legal')
export class LegalController {
  constructor(private readonly legal: LegalService) {}

  @Get()
  @RequirePermissions('documents.read')
  overview(@CurrentUser() user: JwtPayload) {
    return this.legal.overview(user.tenantId);
  }

  @Post(':propertyId/documents')
  @RequirePermissions('documents.create')
  addDocument(
    @CurrentUser() user: JwtPayload,
    @Param('propertyId') propertyId: string,
    @Body(new ZodValidationPipe(addDocumentSchema)) dto: AddDocumentDto,
  ) {
    return this.legal.addDocument(user.tenantId, propertyId, dto);
  }

  @Get(':propertyId/documents/:docId')
  @RequirePermissions('documents.read')
  getDocument(
    @CurrentUser() user: JwtPayload,
    @Param('propertyId') propertyId: string,
    @Param('docId') docId: string,
  ) {
    return this.legal.getDocument(user.tenantId, propertyId, docId);
  }

  @Delete(':propertyId/documents/:docId')
  @RequirePermissions('documents.update')
  removeDocument(
    @CurrentUser() user: JwtPayload,
    @Param('propertyId') propertyId: string,
    @Param('docId') docId: string,
  ) {
    return this.legal.removeDocument(user.tenantId, propertyId, docId);
  }

  @Patch(':propertyId')
  @RequirePermissions('documents.update')
  updateLegal(
    @CurrentUser() user: JwtPayload,
    @Param('propertyId') propertyId: string,
    @Body(new ZodValidationPipe(updateLegalSchema)) dto: UpdateLegalDto,
  ) {
    return this.legal.updateLegal(user.tenantId, propertyId, dto);
  }
}
