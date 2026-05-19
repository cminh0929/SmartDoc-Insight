import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RagService } from './rag.service';
import { RagController } from './rag.controller';
import { EmbeddingService } from './embedding.service';
import { DocumentParserService } from './document-parser.service';
import { DatabaseModule } from '../../db/database.module';
import { StorageModule } from '../../common/storage/storage.module';

@Module({
  imports: [ConfigModule, DatabaseModule, StorageModule],
  providers: [RagService, EmbeddingService, DocumentParserService],
  controllers: [RagController],
  exports: [RagService],
})
export class RagModule {}
