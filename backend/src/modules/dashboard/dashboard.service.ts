import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { documents, folders, documentVersions } from '../../db/schema';
import { count, sql } from 'drizzle-orm';

@Injectable()
export class DashboardService {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async getStats() {
    // 1. Total Documents
    const [docCount] = await this.db.select({ value: count() }).from(documents);

    // 2. Total Folders
    const [folderCount] = await this.db
      .select({ value: count() })
      .from(folders);

    // 3. Storage usage
    const [storageUsage] = await this.db
      .select({
        total: sql<number>`COALESCE(SUM(${documentVersions.fileSize}), 0)`,
      })
      .from(documentVersions);

    // 4. Documents by category (folder)
    const categoryDistribution = await this.db
      .select({
        name: folders.name,
        count: count(documents.id),
      })
      .from(folders)
      .leftJoin(documents, sql`${folders.id} = ${documents.folderId}`)
      .groupBy(folders.name)
      .limit(5);

    // 5. Recent Activity (latest versions)
    const recentActivity = await this.db
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
