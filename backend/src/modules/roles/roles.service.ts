import {
  Injectable,
  Inject,
  ConflictException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { roles } from '../../db/schema';
import { eq, or, isNull, and } from 'drizzle-orm';

@Injectable()
export class RolesService {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll(tenantId?: string) {
    const query = this.db.select().from(roles).orderBy(roles.name);
    if (tenantId) {
      query.where(or(eq(roles.tenantId, tenantId), isNull(roles.tenantId)));
    }
    return query;
  }

  async findByName(name: string) {
    const [role] = await this.db
      .select()
      .from(roles)
      .where(eq(roles.name, name))
      .limit(1);
    return role || null;
  }

  async create(data: any) {
    const {
      name,
      description,
      canCreateRootFolders,
      canUploadRootDocs,
      canViewAuditLogs,
      canManageSharing,
      tenantId,
    } = data;

    const existingRole = await this.findByName(name);
    if (existingRole) {
      throw new ConflictException('Role name already exists');
    }

    const [newRole] = await this.db
      .insert(roles)
      .values({
        name,
        description,
        canCreateRootFolders: !!canCreateRootFolders,
        canUploadRootDocs: !!canUploadRootDocs,
        canViewAuditLogs: !!canViewAuditLogs,
        canManageSharing: !!canManageSharing,
        tenantId: tenantId || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return newRole;
  }

  async update(id: string, data: any, tenantId?: string) {
    const {
      description,
      canCreateRootFolders,
      canUploadRootDocs,
      canViewAuditLogs,
      canManageSharing,
    } = data;

    const [existing] = await this.db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Role not found');
    }

    // Tenant isolation verification: Cannot update global system roles or roles from other tenants
    if (existing.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have permission to modify this role');
    }

    const [updatedRole] = await this.db
      .update(roles)
      .set({
        description,
        canCreateRootFolders:
          canCreateRootFolders !== undefined
            ? !!canCreateRootFolders
            : existing.canCreateRootFolders,
        canUploadRootDocs:
          canUploadRootDocs !== undefined
            ? !!canUploadRootDocs
            : existing.canUploadRootDocs,
        canViewAuditLogs:
          canViewAuditLogs !== undefined
            ? !!canViewAuditLogs
            : existing.canViewAuditLogs,
        canManageSharing:
          canManageSharing !== undefined
            ? !!canManageSharing
            : existing.canManageSharing,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, id))
      .returning();

    return updatedRole;
  }

  async delete(id: string, tenantId?: string) {
    const [existing] = await this.db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Role not found');
    }

    // Do not allow deleting system-critical roles
    if (['admin', 'staff', 'intern'].includes(existing.name) || !existing.tenantId) {
      throw new ConflictException('System critical roles cannot be deleted');
    }

    // Tenant isolation verification
    if (existing.tenantId !== tenantId) {
      throw new ForbiddenException('You do not have permission to delete this role');
    }

    await this.db.delete(roles).where(eq(roles.id, id));

    return { message: 'Role deleted successfully' };
  }
}
