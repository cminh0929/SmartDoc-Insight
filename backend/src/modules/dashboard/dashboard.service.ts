import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { documents, folders, documentVersions } from '../../db/schema';
import { count, sql, eq } from 'drizzle-orm';

@Injectable()
export class DashboardService {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getStats(tenantId?: string) {
    // 1. Total Documents
    const docQuery = this.db.select({ value: count() }).from(documents);
    if (tenantId) {
      docQuery.where(eq(documents.tenantId, tenantId));
    }
    const [docCount] = await docQuery;

    // 2. Total Folders
    const folderQuery = this.db.select({ value: count() }).from(folders);
    if (tenantId) {
      folderQuery.where(eq(folders.tenantId, tenantId));
    }
    const [folderCount] = await folderQuery;

    // 3. Storage usage
    const storageQuery = this.db
      .select({
        total: sql<number>`COALESCE(SUM(${documentVersions.fileSize}), 0)`,
      })
      .from(documentVersions)
      .innerJoin(
        documents,
        sql`${documents.id} = ${documentVersions.documentId}`,
      );
    if (tenantId) {
      storageQuery.where(eq(documents.tenantId, tenantId));
    }
    const [storageUsage] = await storageQuery;

    // 4. Documents by category (folder)
    const categoryQuery = this.db
      .select({
        name: folders.name,
        count: count(documents.id),
      })
      .from(folders)
      .leftJoin(documents, sql`${folders.id} = ${documents.folderId}`)
      .groupBy(folders.name)
      .limit(5);
    if (tenantId) {
      categoryQuery.where(eq(folders.tenantId, tenantId));
    }
    const categoryDistribution = await categoryQuery;

    // 5. Recent Activity (latest versions)
    const recentQuery = this.db
      .select({
        id: documents.id,
        title: documents.title,
        updatedAt: documents.updatedAt,
        fileName: documentVersions.fileName,
      })
      .from(documents)
      .innerJoin(
        documentVersions,
        sql`${documents.id} = ${documentVersions.documentId}`,
      )
      .orderBy(sql`${documents.updatedAt} DESC`)
      .limit(5);
    if (tenantId) {
      recentQuery.where(eq(documents.tenantId, tenantId));
    }
    const recentActivity = await recentQuery;

    return {
      totalDocuments: docCount.value,
      totalFolders: folderCount.value,
      storageUsed: Number(storageUsage.total),
      categoryDistribution: categoryDistribution.map((c) => ({
        name: c.name || 'Uncategorized',
        count: Number(c.count),
      })),
      recentActivity,
    };
  }
}
