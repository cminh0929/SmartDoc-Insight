import {
  Inject,
  Injectable,
  InternalServerErrorException,
  Optional,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { BaseService } from '../../common/base/base.service';
import * as schema from '../../db/schema';
import { documents } from '../../db/schema';
import { StorageService } from '../../common/storage/storage.service';
import { SearchService } from '../search/search.service';
import { AuditLogsService } from '../audit-logs/audit-logs.service';
import { RagService } from '../rag/rag.service';
import { eq, desc, and } from 'drizzle-orm';

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
    @Optional() private readonly ragService: RagService,
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
    tx?: any,
  ) {
    try {
      const dbClient = tx || this.db;

      // 1. Upload file
      const fileKey = await this.storageService.uploadFile(
        file.buffer,
        file.originalname,
      );

      // 2. Get next version number
      const results = await dbClient
        .select({ versionNumber: schema.documentVersions.versionNumber })
        .from(schema.documentVersions)
        .where(eq(schema.documentVersions.documentId, documentId))
        .orderBy(desc(schema.documentVersions.versionNumber))
        .limit(1);

      const nextVersion = results.length > 0 ? results[0].versionNumber + 1 : 1;

      // 3. Create version record
      const [version] = await dbClient
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
      await dbClient
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
      tagIds?: string[];
      tenantId: string;
    },
    file: Express.Multer.File,
  ) {
    try {
      // 1. Create document record in DB
      const doc = await this.db.transaction(async (tx) => {
        const results = (await tx
          .insert(documents)
          .values({
            title: data.title,
            description: data.description,
            folderId: data.folderId,
            ownerId: data.ownerId,
            tenantId: data.tenantId,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning()) as any[];

        const doc = results[0];

        // 2. Insert tags associations
        if (data.tagIds && data.tagIds.length > 0) {
          const docTagsValues = data.tagIds.map((tagId) => ({
            documentId: doc.id,
            tagId,
          }));
          await tx.insert(schema.documentTags).values(docTagsValues);
        }

        // 3. Create first version
        await this.addVersion(doc.id, file, data.ownerId, tx);

        return doc;
      });

      // 4. Sync to Meilisearch
      await this.searchService.addOrUpdateDocument(doc);

      // 5. Log action
      await this.auditLogsService.log({
        userId: data.ownerId,
        action: 'CREATE_DOCUMENT',
        entityType: 'document',
        entityId: doc.id,
        details: `Created document: ${doc.title}`,
      });

      // 6. Trigger async RAG indexing (fire-and-forget, does NOT block response)
      if (this.ragService) {
        const versions = await this.db
          .select()
          .from(schema.documentVersions)
          .where(eq(schema.documentVersions.documentId, doc.id))
          .orderBy(desc(schema.documentVersions.versionNumber))
          .limit(1);
        if (versions.length > 0) {
          const v = versions[0];
          this.ragService
            .indexDocument(
              doc.id,
              v.id,
              v.fileKey,
              v.mimeType ?? '',
              data.tenantId,
            )
            .catch((err) => console.error('RAG indexing failed:', err.message));
        }
      }

      return doc;
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to create document: ${error.message}`,
      );
    }
  }

  async findOneWithTags(id: string) {
    const doc = await this.findOne(id);
    const tagsAssoc = await this.db
      .select({
        id: schema.tags.id,
        name: schema.tags.name,
      })
      .from(schema.documentTags)
      .innerJoin(schema.tags, eq(schema.documentTags.tagId, schema.tags.id))
      .where(eq(schema.documentTags.documentId, id));

    return {
      ...doc,
      tags: tagsAssoc,
    };
  }

  async findAllWithTags(folderId: string | undefined, tenantId: string) {
    const query = this.db
      .select({
        document: documents,
        tag: schema.tags,
      })
      .from(documents)
      .leftJoin(
        schema.documentTags,
        eq(documents.id, schema.documentTags.documentId),
      )
      .leftJoin(schema.tags, eq(schema.documentTags.tagId, schema.tags.id));

    if (folderId) {
      query.where(
        and(eq(documents.folderId, folderId), eq(documents.tenantId, tenantId)),
      );
    } else {
      query.where(eq(documents.tenantId, tenantId));
    }

    const rows = await query;

    // Group by document ID
    const docMap = new Map<string, any>();
    for (const row of rows) {
      const docId = row.document.id;
      if (!docMap.has(docId)) {
        docMap.set(docId, {
          ...row.document,
          tags: [],
        });
      }
      if (row.tag) {
        docMap.get(docId).tags.push(row.tag);
      }
    }

    return Array.from(docMap.values());
  }

  async updateDocumentTags(
    documentId: string,
    tagIds: string[],
    userId: string,
  ) {
    try {
      await this.db.transaction(async (tx) => {
        // 1. Delete existing associations
        await tx
          .delete(schema.documentTags)
          .where(eq(schema.documentTags.documentId, documentId));

        // 2. Insert new associations
        if (tagIds && tagIds.length > 0) {
          const docTagsValues = tagIds.map((tagId) => ({
            documentId,
            tagId,
          }));
          await tx.insert(schema.documentTags).values(docTagsValues);
        }

        // 3. Update document's updatedAt
        await tx
          .update(documents)
          .set({ updatedAt: new Date() })
          .where(eq(documents.id, documentId));
      });

      // Log action
      await this.auditLogsService.log({
        userId,
        action: 'UPDATE_DOCUMENT_TAGS',
        entityType: 'document',
        entityId: documentId,
        details: `Updated tags for document ID: ${documentId}`,
      });

      return this.findOneWithTags(documentId);
    } catch (error: any) {
      throw new InternalServerErrorException(
        `Failed to update document tags: ${error.message}`,
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
