import { Module } from '@nestjs/common';

import { MatchingModule } from '../matching/matching.module';
import { StorageModule } from '../storage/storage.module';

import { PropertiesController } from './properties.controller';
import { PropertiesService } from './properties.service';

@Module({
  imports: [MatchingModule, StorageModule],
  controllers: [PropertiesController],
  providers: [PropertiesService],
})
export class PropertiesModule {}
