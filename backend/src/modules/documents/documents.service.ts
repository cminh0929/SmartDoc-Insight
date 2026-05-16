import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { BaseService } from '../../common/base/base.service';
import * as schema from '../../db/schema';
import { documents } from '../../db/schema';
import { StorageService } from '../../common/storage/storage.service';
import { SearchService } from '../search/search.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class DocumentsService extends BaseService<
  typeof schema.documents.$inferSelect
> {
  constructor(
    @Inject('DATABASE_CONNECTION')
    protected readonly db: NodePgDatabase<typeof schema>,
    private readonly storageService: StorageService,
    private readonly searchService: SearchService,
    private readonly auditLogsService: AuditLogsService,
  ) {
    super(db, documents);
  }

  /**
   * Add a new version to an existing document
   */
  async addVersion(
    documentId: string,
    file: Express.Multer.File,
    uploadedById: string,
  ) {
    try {
      // 1. Upload file
      const fileKey = await this.storageService.uploadFile(
        file.buffer,
        file.originalname,
      );

      // 2. Get next version number
      const results = await this.db
        .select({ versionNumber: schema.documentVersions.versionNumber })
        .from(schema.documentVersions)
        .where(eq(schema.documentVersions.documentId, documentId))
        .orderBy(desc(schema.documentVersions.versionNumber))
        .limit(1);

      const nextVersion = results.length > 0 ? results[0].versionNumber + 1 : 1;

      // 3. Create version record
      const [version] = await this.db
        .insert(schema.documentVersions)
        .values({
          documentId,
          versionNumber: nextVersion,
          fileKey,
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: file.mimetype,
          uploadedById,
          createdAt: new Date(),
        })
        .returning();

      // 4. Update document's updatedAt
      await this.db
        .update(documents)
        .set({ updatedAt: new Date() })
        .where(eq(documents.id, documentId));

      return version;
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to add version: ${error.message}`,
      );
    }
  }

  /**
   * Create a new document with an associated file
   */
  async createDocument(
    data: {
      title: string;
      description?: string;
      folderId?: string;
      ownerId: string;
    },
    file: Express.Multer.File,
  ) {
    try {
      // 1. Create document record in DB
      const doc = await this.db.transaction(async (tx) => {
        const results = (await tx
          .insert(documents)
          .values({
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning()) as any[];

        const doc = results[0];

        // 2. Create first version
        await this.addVersion(doc.id, file, data.ownerId);

        return doc;
      });

      // 3. Sync to Meilisearch
      await this.searchService.addOrUpdateDocument(doc);

      // 4. Log action
      await this.auditLogsService.log({
        userId: data.ownerId,
        action: 'CREATE_DOCUMENT',
        entityType: 'document',
        entityId: doc.id,
        details: `Created document: ${doc.title}`,
      });

      return doc;
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to create document: ${error.message}`,
      );
    }
  }

  async findByFolder(folderId: string) {
    return this.db
      .select()
      .from(documents)
      .where(eq(documents.folderId, folderId));
  }

  /**
   * Delete document and its associated files
   */
  async deleteDocument(id: string) {
    try {
      // 1. Get all versions to delete files from disk
      const versions = await this.db
        .select()
        .from(schema.documentVersions)
        .where(eq(schema.documentVersions.documentId, id));

      // 2. Delete document from DB (cascades or manual deletion)
      const deletedDoc = await this.remove(id);

      // 3. Delete physical files
      for (const version of versions) {
        await this.storageService.deleteFile(version.fileKey);
      }

      // 4. Delete from Meilisearch
      await this.searchService.deleteDocument(id);

      // 5. Log action
      await this.auditLogsService.log({
        action: 'DELETE_DOCUMENT',
        entityType: 'document',
        entityId: id,
        details: `Deleted document with ID: ${id}`,
      });

      return deletedDoc;
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to delete document: ${error.message}`,
      );
    }
  }
}
