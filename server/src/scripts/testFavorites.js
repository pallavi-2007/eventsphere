/**
 * Favorites Verification Tests:
 * 1. Add favorite event (POST /api/favorites/:eventId)
 * 2. Idempotent check: adding same event twice creates exactly 1 record
 * 3. GET /api/favorites returns full populated events with ticket types & available quantities
 * 4. GET /api/favorites/ids returns array of event IDs
 * 5. DELETE /api/favorites/:eventId removes the event
 * 6. Non-existent event returns 404
 */

import { connectDB } from '../config/db.js';
import { redisClient } from '../config/redis.js';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Favorite } from '../models/Favorite.js';
import {
  getUserFavorites,
  addFavorite,
  removeFavorite,
  getUserFavoriteIds
} from '../services/favoriteService.js';
import mongoose from 'mongoose';

async function runTests() {
  console.log('\n=============================================');
  console.log('   EVENTSPHERE - FAVORITES TEST SUITE       ');
  console.log('=============================================\n');

  await connectDB();

  const user = await User.findOne({ email: 'user@eventsphere.com' });
  if (!user) throw new Error('Demo user user@eventsphere.com not found.');

  const event = await Event.findOne({ status: 'published' });
  if (!event) throw new Error('No published test event found.');

  console.log(`Using demo user: ${user.email}`);
  console.log(`Using test event: "${event.title}" (${event._id})\n`);

  let passed = 0;
  let failed = 0;

  // Clean initial state for this user & event
  await Favorite.deleteMany({ userId: user._id, eventId: event._id });

  // ---------------------------------------------------------------------------
  // Test 1: Add favorite event
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 1: Add favorite event ---');
    const fav = await addFavorite(user._id, event._id);
    if (!fav || fav.eventId.toString() !== event._id.toString()) {
      throw new Error('addFavorite failed to create favorite record');
    }
    console.log('✓ PASS: Favorite added successfully\n');
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 1:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // Test 2: Idempotent duplicate add
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 2: Idempotent duplicate add ---');
    await addFavorite(user._id, event._id);
    const count = await Favorite.countDocuments({ userId: user._id, eventId: event._id });
    if (count !== 1) {
      throw new Error(`Expected exactly 1 favorite record, got ${count}`);
    }
    console.log('✓ PASS: Duplicate add handled idempotently without error\n');
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 2:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // Test 3: GET user favorites returns populated events with available quantities
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 3: Get user favorites (full event shape) ---');
    const favorites = await getUserFavorites(user._id);
    if (!Array.isArray(favorites) || favorites.length === 0) {
      throw new Error('getUserFavorites returned empty array');
    }

    const found = favorites.find(f => f._id.toString() === event._id.toString());
    if (!found) {
      throw new Error('Test event not found in favorites list');
    }

    if (!found.ticketTypes || found.ticketTypes.length === 0) {
      throw new Error('Favorite event does not contain ticket types');
    }

    if (found.ticketTypes[0].availableQuantity === undefined) {
      throw new Error('Favorite event does not have attached availableQuantity');
    }

    console.log(`✓ Fetched ${favorites.length} favorite events with ticket availability attached`);
    console.log('✓ PASS: Favorite events match standard events shape\n');
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 3:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // Test 4: Get favorite IDs
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 4: Get favorite IDs ---');
    const ids = await getUserFavoriteIds(user._id);
    if (!ids.includes(event._id.toString())) {
      throw new Error('getUserFavoriteIds does not include test eventId');
    }
    console.log(`✓ PASS: Favorite IDs list contains: ${ids.join(', ')}\n`);
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 4:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // Test 5: Remove favorite
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 5: Remove favorite ---');
    await removeFavorite(user._id, event._id);
    const count = await Favorite.countDocuments({ userId: user._id, eventId: event._id });
    if (count !== 0) {
      throw new Error('Favorite was not removed');
    }

    const idsAfter = await getUserFavoriteIds(user._id);
    if (idsAfter.includes(event._id.toString())) {
      throw new Error('Removed event still appears in favorite IDs');
    }
    console.log('✓ PASS: Favorite successfully removed\n');
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 5:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // Test 6: Non-existent event returns 404
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 6: Non-existent event validation ---');
    const fakeId = new mongoose.Types.ObjectId();
    try {
      await addFavorite(user._id, fakeId);
      throw new Error('Should have thrown error for non-existent event');
    } catch (e) {
      if (e.statusCode === 404) {
        console.log('✓ PASS: Rejected non-existent event with 404\n');
        passed++;
      } else {
        throw e;
      }
    }
  } catch (err) {
    console.error('✗ FAIL Test 6:', err.message);
    failed++;
  }

  console.log('=============================================');
  console.log(`  FAVORITES TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
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
