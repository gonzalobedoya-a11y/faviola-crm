import { Module } from '@nestjs/common';

import { AiModule } from '../ai/ai.module';

import { InboxController } from './inbox.controller';
import { InboxService } from './inbox.service';

@Module({
  imports: [AiModule],
  controllers: [InboxController],
  providers: [InboxService],
})
export class InboxModule {}
