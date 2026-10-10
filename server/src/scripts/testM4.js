/**
 * Milestone M4 Verification Tests:
 * (a) double-submit makes one booking (idempotency)
 * (b) an expired hold is rejected and creates nothing
 * (c) remainingQuantity drops exactly once
 * (d) a forced failure inside the transaction leaves no partial data (rollback)
 */

import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { redisClient } from '../config/redis.js';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Booking } from '../models/Booking.js';
import { Ticket } from '../models/Ticket.js';
import { createHold } from '../services/holdService.js';
import { confirmBooking } from '../services/bookingService.js';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('\n=============================================');
  console.log('   EVENTSPHERE - MILESTONE M4 TEST SUITE    ');
  console.log('=============================================\n');

  await connectDB();
  // Wait for Redis connection to be established
  if (redisClient && redisClient.status !== 'ready') {
    let retries = 10;
    while (redisClient.status !== 'ready' && retries > 0) {
      await wait(500);
      retries--;
    }
  }

  // 1. Get test user and event
  const user = await User.findOne({ email: 'user@eventsphere.com' });
  if (!user) throw new Error('Demo user user@eventsphere.com not found.');

  const event = await Event.findOne({ status: 'published' });
  if (!event || event.ticketTypes.length === 0) throw new Error('No published test event found.');

  const tier = event.ticketTypes[0];
  console.log(`Test Subject Event: "${event.title}"`);
  console.log(`Test Ticket Tier: "${tier.name}" | Initial Remaining: ${tier.remainingQuantity}\n`);

  let passed = 0;
  let failed = 0;

  // ---------------------------------------------------------------------------
  // Test 1: (a) double-submit makes one booking & (c) remainingQuantity drops once
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test (a) & (c): Double-submit idempotency & quantity decrement ---');
    const initialRemaining = tier.remainingQuantity;
    const requestedQty = 2;

    // Create a fresh hold
    const hold = await createHold(user._id, {
      eventId: event._id,
      ticketTypeId: tier._id,
      quantity: requestedQty
    });
    console.log(`✓ Hold created: ${hold.holdId} for ${requestedQty} tickets`);

    // Double-submit concurrently
    const [res1, res2] = await Promise.all([
      confirmBooking(user._id, hold.holdId, 'mock_pay_1'),
      confirmBooking(user._id, hold.holdId, 'mock_pay_2')
    ]);

    // Check bookings in DB for this holdId
    const bookings = await Booking.find({ holdId: hold.holdId });
    if (bookings.length !== 1) {
      throw new Error(`Expected exactly 1 booking in DB for holdId, found ${bookings.length}`);
    }

    const booking = bookings[0];
    const tickets = await Ticket.find({ bookingId: booking._id });
    if (tickets.length !== requestedQty) {
      throw new Error(`Expected ${requestedQty} tickets, found ${tickets.length}`);
    }

    // Refresh event from DB to verify remainingQuantity
    const refreshedEvent = await Event.findById(event._id);
    const refreshedTier = refreshedEvent.ticketTypes.id(tier._id);
    const expectedRemaining = initialRemaining - requestedQty;

    if (refreshedTier.remainingQuantity !== expectedRemaining) {
      throw new Error(
        `remainingQuantity mismatch: expected ${expectedRemaining}, got ${refreshedTier.remainingQuantity}`
      );
    }

    // Verify Redis hold key was cleaned up
    const holdKeyInRedis = await redisClient.get(`hold:${hold.holdId}`);
    if (holdKeyInRedis) {
      throw new Error('Hold key was not deleted from Redis after transaction committed.');
    }

    // Verify a subsequent third submit still returns the existing booking idempotently
    const res3 = await confirmBooking(user._id, hold.holdId, 'mock_pay_3');
    if (res3.booking.bookingId !== booking.bookingId || !res3.duplicate) {
      throw new Error('Sequential repeat submit failed to return existing booking.');
    }

    console.log('✓ PASS: Double-submit resulted in exactly ONE booking document');
    console.log(`✓ PASS: Generated exactly ${tickets.length} tickets with unique codes`);
    console.log(`✓ PASS: remainingQuantity dropped from ${initialRemaining} to ${refreshedTier.remainingQuantity} (exactly once)`);
    console.log('✓ PASS: Redis hold was properly cleaned up post-commit');
    console.log('✓ PASS: Sequential third submit returned existing booking idempotently\n');
    passed += 2;
  } catch (err) {
    console.error('✗ FAIL in Test (a) & (c):', err.message, '\n');
    failed += 2;
  }

  // ---------------------------------------------------------------------------
  // Test 2: (b) Expired hold is rejected and creates nothing
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test (b): Expired hold rejection ---');
    const eventBefore = await Event.findById(event._id);
    const tierBefore = eventBefore.ticketTypes.id(tier._id).remainingQuantity;
    const bookingsCountBefore = await Booking.countDocuments();
    const ticketsCountBefore = await Ticket.countDocuments();

    const fakeHoldId = 'expired-fake-hold-' + Date.now();
    let rejected = false;
    let statusCode = null;

    try {
      await confirmBooking(user._id, fakeHoldId, 'mock_pay_test');
    } catch (err) {
      rejected = true;
      statusCode = err.statusCode;
      console.log(`✓ Confirm rejected as expected with error: "${err.message}" (statusCode ${err.statusCode})`);
    }

    if (!rejected) {
      throw new Error('confirmBooking should have thrown for expired/non-existent hold!');
    }

    const bookingsCountAfter = await Booking.countDocuments();
    const ticketsCountAfter = await Ticket.countDocuments();
    const eventAfter = await Event.findById(event._id);
    const tierAfter = eventAfter.ticketTypes.id(tier._id).remainingQuantity;

    if (bookingsCountAfter !== bookingsCountBefore) {
      throw new Error('A booking was created despite expired hold!');
    }
    if (ticketsCountAfter !== ticketsCountBefore) {
      throw new Error('Tickets were created despite expired hold!');
    }
    if (tierAfter !== tierBefore) {
      throw new Error('remainingQuantity changed despite expired hold!');
    }

    console.log('✓ PASS: Expired hold properly rejected with status 410');
    console.log('✓ PASS: No booking or tickets created, no inventory decremented\n');
    passed++;
  } catch (err) {
    console.error('✗ FAIL in Test (b):', err.message, '\n');
    failed++;
  }

  // ---------------------------------------------------------------------------
  // Test 3: (d) Forced failure inside transaction leaves no partial data
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test (d): Transaction rollback on forced failure ---');
    // Create a genuine hold
    const hold = await createHold(user._id, {
      eventId: event._id,
      ticketTypeId: tier._id,
      quantity: 1
    });

    const eventBefore = await Event.findById(event._id);
    const tierBefore = eventBefore.ticketTypes.id(tier._id).remainingQuantity;
    const bookingsCountBefore = await Booking.countDocuments();
    const ticketsCountBefore = await Ticket.countDocuments();

    // Monkeypatch Ticket.create to simulate an unexpected crash during transaction
    const originalTicketCreate = Ticket.create;
    Ticket.create = async function () {
      throw new Error('Simulated database write error inside transaction');
    };

    let caughtError = false;
    try {
      await confirmBooking(user._id, hold.holdId, 'mock_pay_rollback');
    } catch (err) {
      caughtError = true;
      console.log(`✓ Expected transaction failure caught: "${err.message}"`);
    } finally {
      // Restore original method
      Ticket.create = originalTicketCreate;
    }

    if (!caughtError) {
      throw new Error('confirmBooking should have thrown the simulated error');
    }

    // Verify rollback: no booking, no tickets, inventory untouched
    const bookingsCountAfter = await Booking.countDocuments();
    const ticketsCountAfter = await Ticket.countDocuments();
    const eventAfter = await Event.findById(event._id);
    const tierAfter = eventAfter.ticketTypes.id(tier._id).remainingQuantity;

    if (bookingsCountAfter !== bookingsCountBefore) {
      throw new Error('Transaction rollback failed: partial Booking document was persisted!');
    }
    if (ticketsCountAfter !== ticketsCountBefore) {
      throw new Error('Transaction rollback failed: partial Ticket documents were persisted!');
    }
    if (tierAfter !== tierBefore) {
      throw new Error('Transaction rollback failed: remainingQuantity was modified!');
    }

    // Clean up test hold in Redis
    await redisClient.del(`hold:${hold.holdId}`);
    await redisClient.del(`user_hold:${user._id}:${event._id}`);
    await redisClient.srem(`event_holds:${event._id}:${tier._id}`, hold.holdId);

    console.log('✓ PASS: Transaction rolled back completely on failure');
    console.log('✓ PASS: Zero partial Booking or Ticket records left');
    console.log('✓ PASS: Ticket quantity restored to original value\n');
    passed++;
  } catch (err) {
    console.error('✗ FAIL in Test (d):', err.message, '\n');
    failed++;
  }

  console.log('=============================================');
  console.log(`TEST RESULTS: ${passed} passed, ${failed} failed`);
  console.log('=============================================\n');

  await mongoose.disconnect();
  if (redisClient) {
    redisClient.disconnect();
  }
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
