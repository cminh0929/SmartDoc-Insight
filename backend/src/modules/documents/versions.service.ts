import { Injectable, Inject } from '@nestjs/common';
import { BaseService } from '../../common/base/base.service';
import { documentVersions } from '../../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { eq, desc } from 'drizzle-orm';

@Injectable()
export class VersionsService extends BaseService<typeof documentVersions> {
  constructor(
    @Inject('DATABASE_CONNECTION')
    protected readonly db: NodePgDatabase<typeof schema>,
  ) {
    super(db, documentVersions);
  }

  async findByDocument(documentId: string) {
    return this.db
      .select()
      .from(documentVersions)
      .where(eq(documentVersions.documentId, documentId))
      .orderBy(desc(documentVersions.versionNumber));
  }

  async getLatestVersionNumber(documentId: string): Promise<number> {
    const results = await this.db
      .select({ versionNumber: documentVersions.versionNumber })
      .from(documentVersions)
      .where(eq(documentVersions.documentId, documentId))
      .orderBy(desc(documentVersions.versionNumber))
      .limit(1);

    return results.length > 0 ? results[0].versionNumber : 0;
  }
}
