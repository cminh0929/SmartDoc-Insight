import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../src/db/schema';
import { eq, or } from 'drizzle-orm';
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://it_support_admin:it_support_password@localhost:5432/manage_document_db',
  });
  const db = drizzle(pool, { schema });

  console.log('Cleaning up existing E2E test data...');

  // Delete test users
  const deletedUsers = await db
    .delete(schema.users)
    .where(
      or(
        eq(schema.users.email, 'sarah.connor@cyberdyne.local'),
        eq(schema.users.email, 'john.connor@cyberdyne.local')
      )
    )
    .returning();

  console.log(`Deleted ${deletedUsers.length} test users.`);

  // Delete test tenants
  const deletedTenants = await db
    .delete(schema.tenants)
    .where(eq(schema.tenants.name, 'Cyberdyne Corp'))
    .returning();

  console.log(`Deleted ${deletedTenants.length} test tenants.`);

  console.log('Database cleanup complete.');
  await pool.end();
  process.exit(0);
}

main().catch(console.error);
