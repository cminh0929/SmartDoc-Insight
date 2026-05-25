import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/db/schema';
import { eq, or, inArray } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://it_support_admin:it_support_password@localhost:5432/manage_document_db',
  });
  const db = drizzle(pool, { schema });

  console.log('Cleaning up existing E2E test data with dependency sorting...');

  // 1. Find Cyberdyne tenant
  const cyberdyneTenants = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.name, 'Cyberdyne Corp'));

  const tenantIds = cyberdyneTenants.map((t) => t.id);

  if (tenantIds.length > 0) {
    console.log(`Found Cyberdyne tenants: ${tenantIds.join(', ')}`);

    // 2. Find Cyberdyne users
    const cyberdyneUsers = await db
      .select()
      .from(schema.users)
      .where(inArray(schema.users.tenantId, tenantIds));

    const userIds = cyberdyneUsers.map((u) => u.id);

    if (userIds.length > 0) {
      console.log(`Found Cyberdyne users: ${userIds.join(', ')}`);

      // 3. Delete from audit_logs
      await db
        .delete(schema.auditLogs)
        .where(
          or(
            inArray(schema.auditLogs.tenantId, tenantIds),
            inArray(schema.auditLogs.userId, userIds)
          )
        );
      console.log('Deleted audit logs.');

      // 4. Delete from permissions
      await db
        .delete(schema.permissions)
        .where(inArray(schema.permissions.userId, userIds));
      console.log('Deleted permissions.');
    }

    // 5. Delete document_chunks
    await db
      .delete(schema.documentChunks)
      .where(inArray(schema.documentChunks.tenantId, tenantIds));
    console.log('Deleted document chunks.');

    // 6. Delete document_versions
    // Drizzle documentVersions schema references documents which references folders, let's clean up versions first
    const docs = await db
      .select()
      .from(schema.documents)
      .where(inArray(schema.documents.tenantId, tenantIds));
    
    const docIds = docs.map((d) => d.id);
    if (docIds.length > 0) {
      await db
        .delete(schema.documentVersions)
        .where(inArray(schema.documentVersions.documentId, docIds));
      console.log('Deleted document versions.');
      
      await db
        .delete(schema.documents)
        .where(inArray(schema.documents.id, docIds));
      console.log('Deleted documents.');
    }

    // 7. Delete folders
    await db
      .delete(schema.folders)
      .where(inArray(schema.folders.tenantId, tenantIds));
    console.log('Deleted folders.');

    // 8. Delete roles
    await db
      .delete(schema.roles)
      .where(inArray(schema.roles.tenantId, tenantIds));
    console.log('Deleted roles.');

    // 9. Delete users
    await db
      .delete(schema.users)
      .where(inArray(schema.users.tenantId, tenantIds));
    console.log('Deleted users.');

    // 10. Delete tenants
    await db
      .delete(schema.tenants)
      .where(inArray(schema.tenants.id, tenantIds));
    console.log('Deleted tenants.');
  } else {
    // Fallback: delete by emails directly if tenant was partially created/deleted
    const usersByEmail = await db
      .select()
      .from(schema.users)
      .where(
        or(
          eq(schema.users.email, 'sarah.connor@cyberdyne.local'),
          eq(schema.users.email, 'john.connor@cyberdyne.local')
        )
      );
    const userIds = usersByEmail.map(u => u.id);
    if (userIds.length > 0) {
      await db.delete(schema.auditLogs).where(inArray(schema.auditLogs.userId, userIds));
      await db.delete(schema.permissions).where(inArray(schema.permissions.userId, userIds));
      await db.delete(schema.users).where(inArray(schema.users.id, userIds));
      console.log('Deleted orphaned users by email.');
    }
  }

  console.log('Database cleanup complete.');
  await pool.end();
  process.exit(0);
}

main().catch(console.error);
