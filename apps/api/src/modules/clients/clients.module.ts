import { Module } from '@nestjs/common';

import { MatchingModule } from '../matching/matching.module';

import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';

@Module({
  imports: [MatchingModule],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}
