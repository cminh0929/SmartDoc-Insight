import { Injectable, Inject, ConflictException } from '@nestjs/common';
import { BaseService } from '../../common/base/base.service';
import { tags } from '../../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class TagsService extends BaseService<typeof tags> {
  constructor(
    @Inject('DATABASE_CONNECTION')
    protected readonly db: NodePgDatabase<typeof schema>,
    private readonly auditLogsService: AuditLogsService,
  ) {
    super(db, tags);
  }

  async createTag(name: string, userId: string) {
    // 1. Check if tag name already exists
    const existing = await this.db
      .select()
      .from(tags)
      .where(eq(tags.name, name))
      .limit(1);

    if (existing.length > 0) {
      throw new ConflictException(`Tag with name "${name}" already exists`);
    }

    // 2. Create the tag
    const tag = await this.create({ name });

    // 3. Log to audit log
    await this.auditLogsService.log({
      userId,
      action: 'CREATE_TAG',
      entityType: 'tag',
      entityId: tag.id,
      details: `Created tag: ${tag.name}`,
    });

    return tag;
  }

  async deleteTag(id: string, userId: string) {
    // 1. Get tag details for logging
    const tag = await this.findOne(id);

    // 2. Delete the tag (cascade deletes document associations)
    const result = await this.remove(id);

    // 3. Log to audit log
    await this.auditLogsService.log({
      userId,
      action: 'DELETE_TAG',
      entityType: 'tag',
      entityId: id,
      details: `Deleted tag: ${tag.name}`,
    });

    return result;
  }
}
