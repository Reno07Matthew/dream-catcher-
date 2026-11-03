import assert from 'node:assert';
import http from 'node:http';
import express from 'express';

import { validateText } from './utils/validateText.js';
import { getDatabase, closeDatabase } from './config/database.js';
import { initDatabase } from './config/database-init.js';
import dreamsRouter from './routes/dreams.js';

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n🧪 Running Dream Catcher Tests...\n');

  // ==========================================
  // 1. Unit Tests: Input Validation
  // ==========================================
  console.log('--- Unit Tests: Text Validation ---');

  await test('accepts valid dream text and trims whitespace', () => {
    const result = validateText('   I was flying over mountains   ');
    assert.strictEqual(result.valid, true);
    assert.strictEqual(result.value, 'I was flying over mountains');
  });

  await test('rejects empty string or whitespace-only text', () => {
    const emptyResult = validateText('');
    const whitespaceResult = validateText('    ');
    assert.strictEqual(emptyResult.valid, false);
    assert.strictEqual(whitespaceResult.valid, false);
    assert.match(emptyResult.error, /required/i);
  });

  await test('rejects non-string input (numbers, null, undefined)', () => {
    assert.strictEqual(validateText(null).valid, false);
    assert.strictEqual(validateText(12345).valid, false);
    assert.strictEqual(validateText(undefined).valid, false);
    assert.strictEqual(validateText({}).valid, false);
  });

  await test('rejects dream text exceeding 5000 characters', () => {
    const longText = 'a'.repeat(5001);
    const result = validateText(longText);
    assert.strictEqual(result.valid, false);
    assert.match(result.error, /less than 5000 characters/i);
  });

  // ==========================================
  // 2. Integration Tests: Database Operations
  // ==========================================
  console.log('\n--- Integration Tests: Database ---');

  await test('initializes database table schema', async () => {
    await initDatabase();
    const db = await getDatabase();
    const result = await db.query(
      "SELECT table_name FROM information_schema.tables WHERE table_name = 'dreams'"
    );
    assert.ok(result.rows.length > 0, 'dreams table should exist');
  });

  let testDreamId = null;

  await test('inserts a new dream record', async () => {
    const db = await getDatabase();
    const result = await db.query(
      'INSERT INTO dreams (dream_text, interpretation) VALUES ($1, $2) RETURNING id',
      ['I was swimming in a glowing river', 'Water symbolizes emotion and renewal.']
    );
    assert.ok(result.rows[0].id > 0, 'Insert should produce a positive id');
    testDreamId = result.rows[0].id;
  });

  await test('fetches dream by ID', async () => {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM dreams WHERE id = $1', [testDreamId]);
    const dream = result.rows[0];
    assert.ok(dream);
    assert.strictEqual(dream.dream_text, 'I was swimming in a glowing river');
    assert.strictEqual(dream.interpretation, 'Water symbolizes emotion and renewal.');
  });

  await test('fetches list of all dreams', async () => {
    const db = await getDatabase();
    const result = await db.query('SELECT * FROM dreams ORDER BY created_at DESC');
    assert.ok(Array.isArray(result.rows));
    assert.ok(result.rows.length >= 1);
  });

  await test('deletes a dream by ID', async () => {
    const db = await getDatabase();
    const result = await db.query('DELETE FROM dreams WHERE id = $1', [testDreamId]);
    assert.strictEqual(result.rowCount, 1);

    const deleted = await db.query('SELECT * FROM dreams WHERE id = $1', [testDreamId]);
    assert.strictEqual(deleted.rows.length, 0);
  });

  // ==========================================
  // 3. API Route Tests: Express App Endpoints
  // ==========================================
  console.log('\n--- API Route Tests: /api/dreams ---');

  const app = express();
  app.use(express.json());
  app.use('/api/dreams', dreamsRouter);

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}/api/dreams`;

  try {
    await test('GET /api/dreams returns 200 and an array', async () => {
      const res = await fetch(baseUrl);
      assert.strictEqual(res.status, 200);
      const data = await res.json();
      assert.ok(Array.isArray(data));
    });

    await test('GET /api/dreams/:id returns 404 for non-existent ID', async () => {
      const res = await fetch(`${baseUrl}/99999`);
      assert.strictEqual(res.status, 404);
      const data = await res.json();
      assert.strictEqual(data.error, 'Dream not found');
    });

    await test('POST /api/dreams returns 400 when dream_text is missing or invalid', async () => {
      const res = await fetch(baseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dream_text: '   ' })
      });
      assert.strictEqual(res.status, 400);
      const data = await res.json();
      assert.strictEqual(data.type, 'validation');
    });

    await test('DELETE /api/dreams/:id returns 404 when dream does not exist', async () => {
      const res = await fetch(`${baseUrl}/99999`, { method: 'DELETE' });
      assert.strictEqual(res.status, 404);
      const data = await res.json();
      assert.strictEqual(data.error, 'Dream not found');
    });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    await closeDatabase();
  }

  // ==========================================
  // Summary
  // ==========================================
  console.log('\n====================================');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('====================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
