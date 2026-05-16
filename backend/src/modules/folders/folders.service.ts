import { Injectable, Inject } from '@nestjs/common';
import { BaseService } from '../../common/base/base.service';
import { folders } from '../../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { eq, isNull } from 'drizzle-orm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

@Injectable()
export class FoldersService extends BaseService<typeof folders> {
  constructor(
    @Inject('DATABASE_CONNECTION')
    protected readonly db: NodePgDatabase<typeof schema>,
    private readonly auditLogsService: AuditLogsService,
  ) {
    super(db, folders);
  }

  async getFoldersTree() {
    const allFolders = await this.findAll();

    // Simple tree builder logic
    const folderMap = new Map<string, any>();
    const roots: any[] = [];

    allFolders.forEach((folder: any) => {
      folderMap.set(folder.id, { ...folder, children: [] });
    });

    allFolders.forEach((folder: any) => {
      const folderWithChildren = folderMap.get(folder.id);
      if (folder.parentId && folderMap.has(folder.parentId)) {
        folderMap.get(folder.parentId).children.push(folderWithChildren);
      } else {
        roots.push(folderWithChildren);
      }
    });

    return roots;
  }

  async findByParent(parentId: string | null) {
    return this.db
      .select()
      .from(folders)
      .where(
        parentId ? eq(folders.parentId, parentId) : isNull(folders.parentId),
      );
  }

  async createWithLog(data: any, userId: string) {
    const folder = await this.create(data);
    await this.auditLogsService.log({
      userId,
      action: 'CREATE_FOLDER',
      entityType: 'folder',
      entityId: folder.id,
      details: `Created folder: ${folder.name}`,
    });
    return folder;
  }

  async removeWithLog(id: string, userId: string) {
    const folder = await this.findOne(id);
    const result = await this.remove(id);
    await this.auditLogsService.log({
      userId,
      action: 'DELETE_FOLDER',
      entityType: 'folder',
      entityId: id,
      details: `Deleted folder: ${folder.name}`,
    });
    return result;
  }
}
