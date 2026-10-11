/**
 * Server Startup & Database Robustness Test:
 * 1. Test /health returns accurate database and redis status
 * 2. Start server and send immediate login request before/during startup: must never return 500
 * 3. Verify that if DB is disconnected, requests return 503 ("Server is waking up, please retry")
 * 4. Verify that once DB is connected, login succeeds with 200 without error
 */

import http from 'http';
import mongoose from 'mongoose';
import app from '../app.js';
import { connectDB, getDBStatus, isDBReady } from '../config/db.js';
import { redisClient, getRedisStatus } from '../config/redis.js';

function makeRequest(server, path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const address = server.address();
    const port = address.port;
    const postData = body ? JSON.stringify(body) : null;

    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
        }
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            resolve({ statusCode: res.statusCode, data: parsed });
          } catch {
            resolve({ statusCode: res.statusCode, raw: data });
          }
        });
      }
    );

    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function runTests() {
  console.log('\n=============================================');
  console.log('   EVENTSPHERE - STARTUP ROBUSTNESS TESTS    ');
  console.log('=============================================\n');

  let passed = 0;
  let failed = 0;

  // Start a test server instance
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  console.log(`Test server running on port ${port}\n`);

  // ---------------------------------------------------------------------------
  // Test 1: Immediate request before DB connection must return 503, NEVER 500
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 1: Immediate request before DB connection ---');
    // Ensure DB is not yet connected
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }

    const res = await makeRequest(server, '/api/auth/login', 'POST', {
      email: 'organizer@eventsphere.com',
      password: 'Password123!'
    });

    console.log(`Response received: status=${res.statusCode}, error="${res.data?.error}"`);
    if (res.statusCode === 500) {
      throw new Error('Received 500 Internal Server Error when DB is disconnected!');
    }
    if (res.statusCode !== 503) {
      throw new Error(`Expected 503 Service Unavailable, got ${res.statusCode}`);
    }
    if (!res.data?.error?.includes('waking up')) {
      throw new Error(`Expected error message to mention waking up, got: ${res.data?.error}`);
    }

    console.log('✓ PASS: Immediate request returned 503 with friendly waking up message, never 500\n');
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 1:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // Test 2: /health endpoint reports database and redis accurately
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 2: /health reports accurate status ---');
    const healthBefore = await makeRequest(server, '/health');
    console.log('Health before DB connect:', healthBefore.data);

    if (healthBefore.data.services.database !== 'disconnected') {
      throw new Error(`Expected DB disconnected, got ${healthBefore.data.services.database}`);
    }

    // Now connect DB
    console.log('\nConnecting to database...');
    const connected = await connectDB(3, 1000);
    if (!connected) throw new Error('Could not connect to MongoDB in test');

    const healthAfter = await makeRequest(server, '/health');
    console.log('Health after DB connect:', healthAfter.data);

    if (healthAfter.statusCode !== 200) {
      throw new Error(`Expected health check 200, got ${healthAfter.statusCode}`);
    }
    if (healthAfter.data.services.database !== 'connected') {
      throw new Error(`Expected DB connected, got ${healthAfter.data.services.database}`);
    }

    console.log('✓ PASS: /health accurately reports database and redis statuses\n');
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 2:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // Test 3: Login right after DB connects succeeds with 200, never 500
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 3: Login immediately after DB is connected ---');
    const res = await makeRequest(server, '/api/auth/login', 'POST', {
      email: 'organizer@eventsphere.com',
      password: 'Password123!'
    });

    console.log(`Login response status: ${res.statusCode}`);
    if (res.statusCode !== 200 || !res.data?.success) {
      throw new Error(`Expected 200 OK login, got ${res.statusCode} with error: ${res.data?.error}`);
    }
    if (!res.data?.data?.token) {
      throw new Error('Missing token in login response');
    }

    console.log(`✓ Logged in as ${res.data.data.user.email} (${res.data.data.user.role})`);
    console.log('✓ PASS: Login request succeeds cleanly without error\n');
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 3:', err.message);
    failed++;
  }

  console.log('=============================================');
  console.log(`  ROBUSTNESS TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('=============================================\n');

  await new Promise((resolve) => server.close(resolve));
  if (redisClient) await redisClient.quit().catch(() => {});
  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(async (err) => {
  console.error('Fatal test error:', err);
  if (redisClient) await redisClient.quit().catch(() => {});
  await mongoose.disconnect();
  process.exit(1);
});
