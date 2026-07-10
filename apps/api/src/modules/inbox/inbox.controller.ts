import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import type { JwtPayload } from '../auth/auth.types';

import {
  type AiAssistDto,
  aiAssistSchema,
  type AiSettingsDto,
  aiSettingsSchema,
  type LeadsDashboardDto,
  leadsDashboardSchema,
  type ListConversationsDto,
  listConversationsSchema,
  type SendMessageDto,
  sendMessageSchema,
  type UpdateConversationDto,
  updateConversationSchema,
} from './dto/inbox.dto';
import { InboxService } from './inbox.service';

@ApiTags('inbox')
@ApiBearerAuth()
@Controller('inbox')
export class InboxController {
  constructor(private readonly inbox: InboxService) {}

  @Get()
  @RequirePermissions('inbox.read')
  overview(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(listConversationsSchema)) query: ListConversationsDto,
  ) {
    return this.inbox.overview(user.tenantId, query);
  }

  @Get('leads-dashboard')
  @RequirePermissions('inbox.read')
  leadsDashboard(
    @CurrentUser() user: JwtPayload,
    @Query(new ZodValidationPipe(leadsDashboardSchema)) query: LeadsDashboardDto,
  ) {
    return this.inbox.leadsDashboard(user.tenantId, query.days);
  }

  @Get('conversations/:id')
  @RequirePermissions('inbox.read')
  getConversation(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.inbox.getConversation(user.tenantId, id);
  }

  @Post('conversations/:id/messages')
  @RequirePermissions('inbox.write')
  sendMessage(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(sendMessageSchema)) dto: SendMessageDto,
  ) {
    return this.inbox.sendMessage(user.tenantId, id, dto);
  }

  @Patch('conversations/:id')
  @RequirePermissions('inbox.write')
  updateConversation(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateConversationSchema)) dto: UpdateConversationDto,
  ) {
    return this.inbox.updateConversation(user.tenantId, id, dto);
  }

  @Get('ai/settings')
  @RequirePermissions('ai.use')
  getAiSettings(@CurrentUser() user: JwtPayload) {
    return this.inbox.getAiSettings(user.tenantId);
  }

  @Patch('ai/settings')
  @RequirePermissions('ai.use')
  updateAiSettings(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(aiSettingsSchema)) dto: AiSettingsDto,
  ) {
    return this.inbox.updateAiSettings(user.tenantId, dto);
  }

  @Post('conversations/:id/inbound')
  @RequirePermissions('inbox.write')
  receiveInbound(
    @CurrentUser() user: JwtPayload,
    @Param('id') id: string,
    @Body(new ZodValidationPipe(sendMessageSchema)) dto: SendMessageDto,
  ) {
    return this.inbox.receiveInbound(user.tenantId, id, dto.body);
  }

  @Post('ai')
  @RequirePermissions('ai.use')
  assist(
    @CurrentUser() user: JwtPayload,
    @Body(new ZodValidationPipe(aiAssistSchema)) dto: AiAssistDto,
  ) {
    return this.inbox.assist(user.tenantId, dto);
  }
}
