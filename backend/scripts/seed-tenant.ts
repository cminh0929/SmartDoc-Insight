import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/db/schema';
import { eq, isNull } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://it_support_admin:it_support_password@localhost:5432/manage_document_db',
  });
  const db = drizzle(pool, { schema });

  // Check if Demo Corp already exists
  let demoTenant = await db.select().from(schema.tenants).where(eq(schema.tenants.tenantCode, 'DEMO123')).limit(1);

  if (demoTenant.length === 0) {
    const [newTenant] = await db.insert(schema.tenants).values({
      name: 'SmartDoc Global',
      domain: 'smartdoc.global',
      tenantCode: 'DEMO123',
    }).returning();
    demoTenant = [newTenant];
    console.log('Created SmartDoc Global tenant:', demoTenant[0].id);
  } else {
    console.log('SmartDoc Global tenant already exists:', demoTenant[0].id);
  }

  const tenantId = demoTenant[0].id;

  // Update existing users
  await db.update(schema.users).set({ tenantId }).where(isNull(schema.users.tenantId));
  console.log('Updated users with tenantId');

  // Update existing folders
  await db.update(schema.folders).set({ tenantId }).where(isNull(schema.folders.tenantId));
  console.log('Updated folders with tenantId');

  // Update existing documents
  await db.update(schema.documents).set({ tenantId }).where(isNull(schema.documents.tenantId));
  console.log('Updated documents with tenantId');

  // Update existing audit logs
  await db.update(schema.auditLogs).set({ tenantId }).where(isNull(schema.auditLogs.tenantId));
  console.log('Updated audit logs with tenantId');

  // Update existing roles
  await db.update(schema.roles).set({ tenantId }).where(isNull(schema.roles.tenantId));
  console.log('Updated roles with tenantId');

  console.log('Seeding complete.');
  process.exit(0);
}

main().catch(console.error);
