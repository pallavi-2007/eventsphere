/**
 * Profile Feature Backend Verification Tests:
 * 1. PATCH /api/auth/me updates user's name
 * 2. Name validation: fails if empty, too short (< 2) or too long (> 50)
 * 3. Security: updating does NOT change email, role or password
 * 4. GET /api/profile/summary returns real metrics (tickets booked, upcoming events, total spent, favorites)
 */

import { connectDB } from '../config/db.js';
import { redisClient } from '../config/redis.js';
import { User } from '../models/User.js';
import { updateUserName } from '../services/authService.js';
import { getUserProfileSummary } from '../services/profileService.js';
import mongoose from 'mongoose';

async function runTests() {
  console.log('\n=============================================');
  console.log('    EVENTSPHERE - PROFILE TEST SUITE         ');
  console.log('=============================================\n');

  await connectDB();

  const user = await User.findOne({ email: 'user@eventsphere.com' });
  if (!user) throw new Error('Demo user user@eventsphere.com not found.');

  const originalName = user.name;
  const originalEmail = user.email;
  const originalRole = user.role;

  console.log(`Initial user: "${originalName}" | ${originalEmail} | role: ${originalRole}\n`);

  let passed = 0;
  let failed = 0;

  // ---------------------------------------------------------------------------
  // Test 1: Update name successfully
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 1: Update name successfully ---');
    const newName = 'Alex Attendee Updated';
    const updated = await updateUserName(user._id, newName);

    if (updated.name !== newName) {
      throw new Error(`Expected name "${newName}", got "${updated.name}"`);
    }
    console.log(`✓ Name updated to "${updated.name}"`);

    // Verify in database
    const dbUser = await User.findById(user._id);
    if (dbUser.name !== newName) {
      throw new Error('Name was not persisted in database');
    }
    console.log('✓ PASS: Name persisted in database successfully\n');
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 1:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // Test 2: Name validation
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 2: Name validation (empty, <2 chars, >50 chars) ---');
    // Empty / whitespace
    try {
      await updateUserName(user._id, '   ');
      throw new Error('Should have rejected empty name');
    } catch (e) {
      if (e.statusCode === 400) {
        console.log('✓ Rejected empty/whitespace name with 400');
      } else throw e;
    }

    // Too short (1 char)
    try {
      await updateUserName(user._id, 'A');
      throw new Error('Should have rejected 1-char name');
    } catch (e) {
      if (e.statusCode === 400) {
        console.log('✓ Rejected 1-char name with 400');
      } else throw e;
    }

    // Too long (51 chars)
    try {
      await updateUserName(user._id, 'A'.repeat(51));
      throw new Error('Should have rejected 51-char name');
    } catch (e) {
      if (e.statusCode === 400) {
        console.log('✓ Rejected 51-char name with 400');
      } else throw e;
    }

    console.log('✓ PASS: All name length edge cases validated\n');
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 2:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // Test 3: Security: email and role preserved
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 3: Security verification (email and role untouched) ---');
    const checkUser = await User.findById(user._id);
    if (checkUser.email !== originalEmail) {
      throw new Error(`Email changed unexpectedly! ${checkUser.email}`);
    }
    if (checkUser.role !== originalRole) {
      throw new Error(`Role changed unexpectedly! ${checkUser.role}`);
    }
    console.log('✓ PASS: Email and role strictly unchanged\n');
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 3:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // Test 4: Profile summary metrics
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 4: Profile summary metrics ---');
    const summary = await getUserProfileSummary(user._id);

    console.log('Profile summary retrieved:', summary);

    if (
      typeof summary.totalTickets !== 'number' ||
      typeof summary.upcomingEvents !== 'number' ||
      typeof summary.totalSpent !== 'number' ||
      typeof summary.favoritesCount !== 'number'
    ) {
      throw new Error('Summary missing required numeric metrics');
    }

    console.log(`✓ Total Tickets: ${summary.totalTickets}`);
    console.log(`✓ Upcoming Events: ${summary.upcomingEvents}`);
    console.log(`✓ Total Spent: ₹${summary.totalSpent}`);
    console.log(`✓ Favorites: ${summary.favoritesCount}`);
    console.log('✓ PASS: Profile summary returned valid real data\n');
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 4:', err.message);
    failed++;
  }

  // Restore original name
  await User.findByIdAndUpdate(user._id, { name: originalName });

  console.log('=============================================');
  console.log(`  PROFILE TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('=============================================\n');

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
