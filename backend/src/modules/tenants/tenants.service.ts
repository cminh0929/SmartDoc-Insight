import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from '../../db/schema';
import { eq } from 'drizzle-orm';

@Injectable()
export class TenantsService {
  constructor(
    @Inject('DATABASE_CONNECTION')
    private readonly db: NodePgDatabase<typeof schema>,
  ) {}

  private generateInviteCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  async createTenant(name: string, domain?: string) {
    let code = this.generateInviteCode();
    let isUnique = false;

    // Ensure uniqueness
    while (!isUnique) {
      const existing = await this.findByCode(code);
      if (existing) {
        code = this.generateInviteCode();
      } else {
        isUnique = true;
      }
    }

    const [tenant] = await this.db
      .insert(schema.tenants)
      .values({
        name,
        domain,
        tenantCode: code,
      })
      .returning();

    return tenant;
  }

  async findByCode(code: string) {
    const [tenant] = await this.db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.tenantCode, code))
      .limit(1);
    return tenant || null;
  }

  async findById(id: string) {
    const [tenant] = await this.db
      .select()
      .from(schema.tenants)
      .where(eq(schema.tenants.id, id))
      .limit(1);
    return tenant || null;
  }

  async getEmployees(tenantId: string) {
    return this.db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        fullName: schema.users.fullName,
        role: schema.users.role,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.tenantId, tenantId));
  }
}
