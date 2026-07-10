import { Module } from '@nestjs/common';

import { LegalController } from './legal.controller';
import { LegalDocumentStorageService } from './legal-document-storage.service';
import { LegalService } from './legal.service';

@Module({
  controllers: [LegalController],
  providers: [LegalService, LegalDocumentStorageService],
})
export class LegalModule {}
