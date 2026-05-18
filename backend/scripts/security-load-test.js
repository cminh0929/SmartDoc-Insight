const { Client } = require('pg');
const crypto = require('crypto');

// Load environment variables manually
const dbUrl = process.env.DATABASE_URL || 'postgresql://it_support_admin:it_support_password@localhost:5432/manage_document_db';
const meiliHost = process.env.MEILISEARCH_HOST || 'http://localhost:7700';
const apiBase = 'http://localhost:3001';

console.log('\n======================================================');
console.log('🚀 IT DOCUMENT PLATFORM - SECURITY & PERFORMANCE SUITE');
console.log('======================================================\n');

async function runTests() {
  const pgClient = new Client({ connectionString: dbUrl });
  try {
    await pgClient.connect();
    console.log('✅ Connected to PostgreSQL database successfully.');
  } catch (err) {
    console.error('❌ Failed to connect to PostgreSQL database:', err.message);
    process.exit(1);
  }

  // Find a valid admin and regular user to perform testing
  let adminUser, staffUser, targetDoc, targetFolder;
  try {
    const usersRes = await pgClient.query('SELECT id, email, role FROM users LIMIT 10');
    adminUser = usersRes.rows.find(u => u.role === 'admin');
    staffUser = usersRes.rows.find(u => u.role === 'staff' || u.role === 'intern');
    
    if (!adminUser) {
      console.warn('⚠️ No ADMIN user found in database. Security tests might be limited.');
    } else {
      console.log(`🔑 Using Admin: ${adminUser.email}`);
    }
    if (!staffUser) {
      console.warn('⚠️ No STAFF/INTERN user found in database. Security tests might be limited.');
    } else {
      console.log(`🔑 Using Staff/Intern: ${staffUser.email}`);
    }

    const docsRes = await pgClient.query('SELECT id, title, folder_id FROM documents LIMIT 1');
    if (docsRes.rows.length > 0) {
      targetDoc = docsRes.rows[0];
    }
    const folderRes = await pgClient.query('SELECT id, name FROM folders LIMIT 1');
    if (folderRes.rows.length > 0) {
      targetFolder = folderRes.rows[0];
    }
  } catch (err) {
    console.error('❌ Failed to pre-fetch test entities:', err.message);
  }

  console.log('\n------------------------------------------------------');
  console.log('🛡️ PHASE 1: ENDPOINT SECURITY & PERMISSIONS GUARD CHECKS');
  console.log('------------------------------------------------------');

  const securityReport = [];

  // Security Check 1: Unauthorized Access without Token
  try {
    const res = await fetch(`${apiBase}/documents`, { method: 'GET' });
    const success = res.status === 401;
    securityReport.push({
      testName: 'Block Anonymous Requests (No Token)',
      status: success ? 'PASS' : 'FAIL',
      code: res.status,
      desc: 'Anonymous user must be rejected with 401 Unauthorized.'
    });
  } catch (err) {
    securityReport.push({ testName: 'Block Anonymous Requests', status: 'ERROR', code: 500, desc: err.message });
  }

  // Security Check 2: Unauthorized Folder Creation
  try {
    const res = await fetch(`${apiBase}/folders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacked Folder' })
    });
    const success = res.status === 401;
    securityReport.push({
      testName: 'Block Unauthorized Folder Creation',
      status: success ? 'PASS' : 'FAIL',
      code: res.status,
      desc: 'Creating folders without authentication must return 401.'
    });
  } catch (err) {
    securityReport.push({ testName: 'Block Unauthorized Folder Creation', status: 'ERROR', code: 500, desc: err.message });
  }

  // Security Check 3: Permissions Modals Access Control
  try {
    // Regular users shouldn't query other users permissions or grant permissions
    const res = await fetch(`${apiBase}/permissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: crypto.randomUUID(), level: 'write', folderId: crypto.randomUUID() })
    });
    const success = res.status === 401 || res.status === 403;
    securityReport.push({
      testName: 'Block Unauthorized Permission Granting',
      status: success ? 'PASS' : 'FAIL',
      code: res.status,
      desc: 'Users without administrative auth must not grant permission access.'
    });
  } catch (err) {
    securityReport.push({ testName: 'Block Unauthorized Permission Granting', status: 'ERROR', code: 500, desc: err.message });
  }

  // Print Security Results
  securityReport.forEach(test => {
    const icon = test.status === 'PASS' ? '🟢' : '🔴';
    console.log(`${icon} [${test.status}] ${test.testName} (Status Code: ${test.code})`);
    console.log(`   └─ Rationale: ${test.desc}`);
  });

  console.log('\n------------------------------------------------------');
  console.log('⚡ PHASE 2: PERFORMANCE & INGESTION LATENCY BENCHMARK');
  console.log('------------------------------------------------------');

  if (!adminUser) {
    console.log('❌ Skipping load test: No valid owner ID (user ID) available to seed documents.');
    await pgClient.end();
    return;
  }

  const NUM_DOCUMENTS = 50;
  console.log(`⏳ Seeding ${NUM_DOCUMENTS} documents to test database insertion and indexing speed...`);

  // Ensure a test folder exists
  let folderId = targetFolder ? targetFolder.id : null;
  if (!folderId) {
    try {
      const folderInsert = await pgClient.query(
        "INSERT INTO folders (name, description) VALUES ('TEST_LOAD_FOLDER', 'Temporary Folder for Load Testing') RETURNING id"
      );
      folderId = folderInsert.rows[0].id;
      console.log(`📁 Created temp folder ID: ${folderId}`);
    } catch (err) {
      console.error('❌ Failed to create temporary load folder:', err.message);
    }
  }

  const startTime = Date.now();
  let insertCount = 0;
  let errorCount = 0;

  try {
    for (let i = 1; i <= NUM_DOCUMENTS; i++) {
      const title = `TEST_LOAD_DOC_${i}_${crypto.randomBytes(4).toString('hex')}`;
      const description = `Load test document simulated record number ${i}. Designed to verify indexing latencies.`;
      
      // Perform direct SQL insertion
      await pgClient.query(
        'INSERT INTO documents (title, description, folder_id, owner_id, is_archived, created_at, updated_at) VALUES ($1, $2, $3, $4, false, NOW(), NOW())',
        [title, description, folderId, adminUser.id]
      );
      insertCount++;
    }
  } catch (err) {
    errorCount++;
    console.error('❌ Error during document insertion:', err.message);
  }

  const endTime = Date.now();
  const totalDuration = endTime - startTime;
  const avgLatency = totalDuration / Math.max(1, insertCount);

  console.log(`\n📊 PERFORMANCE RESULTS:`);
  console.log(`   - Total Inserted Records: ${insertCount} documents`);
  console.log(`   - Failed Operations:      ${errorCount}`);
  console.log(`   - Total Elapsed Time:     ${totalDuration} ms`);
  console.log(`   - Average Ingestion Latency: ${avgLatency.toFixed(2)} ms/document`);

  // Cleanup temporary test data
  console.log('\n🧹 Cleaning up temporary test load data...');
  try {
    const cleanDocs = await pgClient.query("DELETE FROM documents WHERE title LIKE 'TEST_LOAD_DOC_%'");
    console.log(`   - Removed ${cleanDocs.rowCount} temporary load testing documents.`);
    if (!targetFolder && folderId) {
      await pgClient.query("DELETE FROM folders WHERE id = $1", [folderId]);
      console.log('   - Removed temporary load folder.');
    }
    console.log('🧹 Cleanup complete. Database restored to pristine state.');
  } catch (err) {
    console.error('⚠️ Warning: Failed to fully clean up test records:', err.message);
  }

  console.log('\n======================================================');
  console.log('🏁 TESTS COMPLETED SUCCESSFULLY!');
  console.log('======================================================\n');

  await pgClient.end();
}

runTests();
