import {
  Injectable,
  Inject,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { BaseService } from '../../common/base/base.service';
import { permissions, users, documents, folders } from '../../db/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { eq, and, or, isNull } from 'drizzle-orm';
import { AuditLogsService } from '../audit-logs/audit-logs.service';

const PERMISSION_SCORES = {
  read: 1,
  write: 2,
  admin: 3,
};

@Injectable()
export class PermissionsService extends BaseService<typeof permissions> {
  constructor(
    @Inject('DATABASE_CONNECTION')
    protected readonly db: NodePgDatabase<typeof schema>,
    private readonly auditLogsService: AuditLogsService,
  ) {
    super(db, permissions);
  }

  async getPermissionsByEntity(documentId?: string, folderId?: string) {
    if (!documentId && !folderId) {
      throw new Error('Must provide either documentId or folderId');
    }

    const query = this.db
      .select({
        id: permissions.id,
        level: permissions.level,
        createdAt: permissions.createdAt,
        updatedAt: permissions.updatedAt,
        user: {
          id: users.id,
          email: users.email,
          fullName: users.fullName,
          role: users.role,
        },
      })
      .from(permissions)
      .innerJoin(users, eq(permissions.userId, users.id));

    if (documentId) {
      return query.where(eq(permissions.documentId, documentId));
    } else {
      return query.where(eq(permissions.folderId, folderId!));
    }
  }

  async grantPermission(
    dto: {
      userId: string;
      documentId?: string;
      folderId?: string;
      level: 'read' | 'write' | 'admin';
    },
    adminUserId: string,
  ) {
    // 1. Validate user exists
    const userExists = await this.db
      .select()
      .from(users)
      .where(eq(users.id, dto.userId))
      .limit(1);

    if (userExists.length === 0) {
      throw new NotFoundException('Target user not found');
    }

    // 2. Check if permission already exists for this user/entity
    let existing: any[] = [];
    if (dto.documentId) {
      existing = await this.db
        .select()
        .from(permissions)
        .where(
          and(
            eq(permissions.userId, dto.userId),
            eq(permissions.documentId, dto.documentId),
          ),
        )
        .limit(1);
    } else if (dto.folderId) {
      existing = await this.db
        .select()
        .from(permissions)
        .where(
          and(
            eq(permissions.userId, dto.userId),
            eq(permissions.folderId, dto.folderId),
          ),
        )
        .limit(1);
    } else {
      throw new Error('Must specify documentId or folderId');
    }

    let permissionRecord: any;

    if (existing.length > 0) {
      // Update existing permission
      const updateResult = await this.update(existing[0].id, {
        level: dto.level,
        updatedAt: new Date(),
      });
      permissionRecord = updateResult;
    } else {
      // Create new permission
      permissionRecord = await this.create({
        userId: dto.userId,
        documentId: dto.documentId || null,
        folderId: dto.folderId || null,
        level: dto.level,
      });
    }

    // Log in audit log
    const entityType = dto.documentId ? 'document' : 'folder';
    const entityId = dto.documentId || dto.folderId!;

    await this.auditLogsService.log({
      userId: adminUserId,
      action: 'GRANT_PERMISSION',
      entityType,
      entityId,
      details: `Granted ${dto.level} permission to ${userExists[0].fullName} (${userExists[0].email})`,
    });

    return permissionRecord;
  }

  async revokePermission(id: string, adminUserId: string) {
    const permission = await this.findOne(id);
    if (!permission) {
      throw new NotFoundException('Permission record not found');
    }

    const targetUser = await this.db
      .select()
      .from(users)
      .where(eq(users.id, permission.userId))
      .limit(1);

    const userName =
      targetUser.length > 0 ? targetUser[0].fullName : 'Unknown User';

    const result = await this.remove(id);

    const entityType = permission.documentId ? 'document' : 'folder';
    const entityId = permission.documentId || permission.folderId!;

    await this.auditLogsService.log({
      userId: adminUserId,
      action: 'REVOKE_PERMISSION',
      entityType,
      entityId,
      details: `Revoked permission from user ${userName}`,
    });

    return result;
  }

  async checkEffectivePermission(
    userId: string,
    entityType: 'document' | 'folder',
    entityId: string,
    requiredLevel: 'read' | 'write' | 'admin',
  ): Promise<boolean> {
    // 1. Fetch user to verify role
    const userList = await this.db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (userList.length === 0) return false;
    const user = userList[0];

    // 2. Admin role has absolute access *within their own tenant*
    // The actual tenant boundary check happens when we fetch the document or folder below,
    // so we can't just return true here blindly. We must check the resource's tenantId first.
    // So we remove the early return and handle admin down below after fetching the entity.

    const requiredScore = PERMISSION_SCORES[requiredLevel];

    // 3. Resolve permissions by entity type
    if (entityType === 'document') {
      const docList = await this.db
        .select()
        .from(documents)
        .where(eq(documents.id, entityId))
        .limit(1);

      if (docList.length === 0) return false;
      const doc = docList[0];

      // Cross-Tenant data leakage protection
      if (doc.tenantId !== user.tenantId) return false;

      // Admin role has absolute access within tenant
      if (user.role === 'admin') return true;

      // Document owner has absolute admin rights
      if (doc.ownerId === userId) return true;

      // Check explicit document permission
      const explicit = await this.db
        .select()
        .from(permissions)
        .where(
          and(
            eq(permissions.userId, userId),
            eq(permissions.documentId, entityId),
          ),
        )
        .limit(1);

      if (explicit.length > 0) {
        return PERMISSION_SCORES[explicit[0].level] >= requiredScore;
      }

      // Check inherited folder permission
      if (doc.folderId) {
        return this.checkFolderPermissionRecursive(
          userId,
          doc.folderId,
          requiredLevel,
          user.role,
        );
      }
    } else {
      // Check explicit folder permission
      const explicit = await this.db
        .select()
        .from(permissions)
        .where(
          and(
            eq(permissions.userId, userId),
            eq(permissions.folderId, entityId),
          ),
        )
        .limit(1);

      if (explicit.length > 0) {
        return PERMISSION_SCORES[explicit[0].level] >= requiredScore;
      }

      const folderList = await this.db
        .select()
        .from(folders)
        .where(eq(folders.id, entityId))
        .limit(1);

      if (folderList.length === 0) return false;
      const folder = folderList[0];

      // Cross-Tenant data leakage protection
      if (folder.tenantId !== user.tenantId) return false;

      // Admin role has absolute access within tenant
      if (user.role === 'admin') return true;

      // Check inherited parent folder permission
      if (folder.parentId) {
        return this.checkFolderPermissionRecursive(
          userId,
          folder.parentId,
          requiredLevel,
          user.role,
        );
      }
    }

    // Default Fallbacks: If no explicit configuration is found anywhere in the tree
    if (user.role === 'staff') {
      // Staff can read everything active, and can write/delete only if owner (handled above).
      // Let's grant them read access by default
      return requiredLevel === 'read';
    }

    if (user.role === 'intern') {
      // Intern can only read
      return requiredLevel === 'read';
    }

    return false;
  }

  private async checkFolderPermissionRecursive(
    userId: string,
    folderId: string,
    requiredLevel: 'read' | 'write' | 'admin',
    userRole: string,
  ): Promise<boolean> {
    const requiredScore = PERMISSION_SCORES[requiredLevel];

    // Check explicit folder permission
    const explicit = await this.db
      .select()
      .from(permissions)
      .where(
        and(eq(permissions.userId, userId), eq(permissions.folderId, folderId)),
      )
      .limit(1);

    if (explicit.length > 0) {
      return PERMISSION_SCORES[explicit[0].level] >= requiredScore;
    }

    // Recurse up tree
    const folderList = await this.db
      .select()
      .from(folders)
      .where(eq(folders.id, folderId))
      .limit(1);

    if (folderList.length === 0) return false;
    const folder = folderList[0];

    if (folder.parentId) {
      return this.checkFolderPermissionRecursive(
        userId,
        folder.parentId,
        requiredLevel,
        userRole,
      );
    }

    // Base Case Fallbacks at root folder level
    if (userRole === 'staff') {
      return requiredLevel === 'read';
    }

    if (userRole === 'intern') {
      return requiredLevel === 'read';
    }

    return false;
  }
}
