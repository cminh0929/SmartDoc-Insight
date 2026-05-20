import { Module, forwardRef } from '@nestjs/common';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { StorageModule } from '../../common/storage/storage.module';
import { SearchModule } from '../search/search.module';
import { VersionsService } from './versions.service';
import { VersionsController } from './versions.controller';
import { AuditLogsModule } from '../audit-logs/audit-logs.module';
import { RagModule } from '../rag/rag.module';

@Module({
  imports: [
    StorageModule,
    SearchModule,
    AuditLogsModule,
    forwardRef(() => RagModule),
  ],
  controllers: [DocumentsController, VersionsController],
  providers: [DocumentsService, VersionsService],
  exports: [DocumentsService, VersionsService],
})
export class DocumentsModule {}
