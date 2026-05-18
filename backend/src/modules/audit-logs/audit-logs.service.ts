import { Injectable, Inject } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { auditLogs } from '../../db/schema';
import { BaseService } from '../../common/base/base.service';
import { desc, eq } from 'drizzle-orm';
import { Parser } from 'json2csv';

@Injectable()
export class AuditLogsService extends BaseService<any> {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly dbConn: NodePgDatabase<typeof schema>,
  ) {
    super(dbConn, auditLogs);
  }

  async log(data: {
    userId?: string;
    action: string;
    entityType: string;
    entityId?: string;
    details?: string;
    ipAddress?: string;
    userAgent?: string;
    tenantId?: string;
  }) {
    let finalTenantId = data.tenantId;

    if (!finalTenantId && data.userId) {
      const userList = await this.dbConn
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, data.userId))
        .limit(1);
      if (userList.length > 0) {
        finalTenantId = userList[0].tenantId ?? undefined;
      }
    }

    return this.dbConn
      .insert(auditLogs)
      .values({
        userId: data.userId,
        action: data.action,
        entityType: data.entityType,
        entityId: data.entityId,
        details: data.details,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        tenantId: finalTenantId,
        createdAt: new Date(),
      })
      .returning();
  }

  async findAllLogs(tenantId: string, limit = 100, offset = 0) {
    return this.dbConn
      .select({
        id: auditLogs.id,
        action: auditLogs.action,
        entityType: auditLogs.entityType,
        entityId: auditLogs.entityId,
        details: auditLogs.details,
        ipAddress: auditLogs.ipAddress,
        userAgent: auditLogs.userAgent,
        createdAt: auditLogs.createdAt,
        user: {
          id: schema.users.id,
          fullName: schema.users.fullName,
          email: schema.users.email,
        },
      })
      .from(auditLogs)
      .leftJoin(schema.users, eq(auditLogs.userId, schema.users.id))
      .where(eq(auditLogs.tenantId, tenantId))
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async exportLogs(tenantId: string) {
    const logs = await this.findAllLogs(tenantId, 1000, 0);
    const fields = [
      'id',
      'action',
      'entityType',
      'entityId',
      'details',
      'createdAt',
      'user.fullName',
      'user.email',
    ];
    const opts = { fields };
    const parser = new Parser(opts);
    return parser.parse(logs);
  }
}
