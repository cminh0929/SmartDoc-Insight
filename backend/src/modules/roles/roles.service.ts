import { Injectable, Inject, ConflictException, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { roles } from '../../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class RolesService {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  async findAll() {
    return this.db
      .select()
      .from(roles)
      .orderBy(roles.name);
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
    const { name, description, canCreateRootFolders, canUploadRootDocs, canViewAuditLogs, canManageSharing } = data;

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
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return newRole;
  }

  async update(id: string, data: any) {
    const { description, canCreateRootFolders, canUploadRootDocs, canViewAuditLogs, canManageSharing } = data;

    const [existing] = await this.db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Role not found');
    }

    // Do not allow updating core system roles name, only custom permissions
    const [updatedRole] = await this.db
      .update(roles)
      .set({
        description,
        canCreateRootFolders: canCreateRootFolders !== undefined ? !!canCreateRootFolders : existing.canCreateRootFolders,
        canUploadRootDocs: canUploadRootDocs !== undefined ? !!canUploadRootDocs : existing.canUploadRootDocs,
        canViewAuditLogs: canViewAuditLogs !== undefined ? !!canViewAuditLogs : existing.canViewAuditLogs,
        canManageSharing: canManageSharing !== undefined ? !!canManageSharing : existing.canManageSharing,
        updatedAt: new Date(),
      })
      .where(eq(roles.id, id))
      .returning();

    return updatedRole;
  }

  async delete(id: string) {
    const [existing] = await this.db
      .select()
      .from(roles)
      .where(eq(roles.id, id))
      .limit(1);

    if (!existing) {
      throw new NotFoundException('Role not found');
    }

    // Do not allow deleting system-critical roles
    if (['admin', 'staff', 'intern'].includes(existing.name)) {
      throw new ConflictException('System critical roles cannot be deleted');
    }

    await this.db
      .delete(roles)
      .where(eq(roles.id, id));

    return { message: 'Role deleted successfully' };
  }
}
