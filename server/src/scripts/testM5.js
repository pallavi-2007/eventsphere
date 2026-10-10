/**
 * Milestone M5 Verification Tests:
 * 1. GET /api/tickets/mine returns upcoming and past tickets with event and booking details
 * 2. GET /api/tickets/:id/qr-token generates a valid signed JWT containing ticketId and eventId
 * 3. verifyQrToken validates a genuine token
 * 4. verifyQrToken catches forged signature (forged token)
 * 5. verifyQrToken catches expired token
 * 6. Refuse QR token if ticket is used or cancelled
 */

import jwt from 'jsonwebtoken';
import { connectDB } from '../config/db.js';
import { redisClient } from '../config/redis.js';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Booking } from '../models/Booking.js';
import { Ticket } from '../models/Ticket.js';
import { config } from '../config/env.js';
import { getUserTickets, generateQrToken, verifyQrToken } from '../services/ticketService.js';
import mongoose from 'mongoose';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('\n=============================================');
  console.log('   EVENTSPHERE - MILESTONE M5 TEST SUITE    ');
  console.log('=============================================\n');

  await connectDB();

  const user = await User.findOne({ email: 'user@eventsphere.com' });
  if (!user) throw new Error('Demo user user@eventsphere.com not found.');

  const otherUser = await User.findOne({ email: 'organizer@eventsphere.com' });

  // Find or create a test event
  let event = await Event.findOne({ status: 'published' });
  if (!event) throw new Error('No published event found.');

  // Clean up any test tickets
  console.log('--- Setting up test ticket ---');
  let booking = await Booking.findOne({ userId: user._id });
  let ticket;

  if (booking) {
    ticket = await Ticket.findOne({ bookingId: booking._id, userId: user._id });
  }

  if (!ticket) {
    // Create a temporary booking and ticket
    booking = await Booking.create({
      bookingId: `EVS-TEST-${Date.now()}`,
      userId: user._id,
      eventId: event._id,
      ticketTypeId: event.ticketTypes[0]._id.toString(),
      ticketTypeName: event.ticketTypes[0].name,
      quantity: 1,
      unitPrice: event.ticketTypes[0].price,
      subtotal: event.ticketTypes[0].price,
      platformFee: 49,
      total: event.ticketTypes[0].price + 49,
      orderId: `ORD-TEST-${Date.now()}`,
      paymentId: `PAY-TEST-${Date.now()}`,
      status: 'paid',
      eventSnapshot: {
        title: event.title,
        dateTime: event.dateTime,
        venue: event.venue,
        bannerUrl: event.bannerUrl
      }
    });

    ticket = await Ticket.create({
      bookingId: booking._id,
      userId: user._id,
      eventId: event._id,
      ticketTypeId: event.ticketTypes[0]._id.toString(),
      ticketTypeName: event.ticketTypes[0].name,
      ticketCode: `TKT-TEST-${Date.now()}`,
      status: 'valid'
    });
  }

  console.log(`Using test ticket ${ticket._id} (${ticket.ticketCode}) for user ${user.email}\n`);

  let passed = 0;
  let failed = 0;

  // ---------------------------------------------------------------------------
  // Test 1: getUserTickets returns upcoming and past lists
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 1: getUserTickets (Upcoming / Past split) ---');
    const myTickets = await getUserTickets(user._id);
    if (!myTickets || !Array.isArray(myTickets.upcoming) || !Array.isArray(myTickets.past)) {
      throw new Error('getUserTickets must return { upcoming: [], past: [] }');
    }
    console.log(`✓ Fetched tickets: total=${myTickets.total}, upcoming=${myTickets.upcoming.length}, past=${myTickets.past.length}`);

    // Verify fields populated
    const found = [...myTickets.upcoming, ...myTickets.past].find(t => t._id.toString() === ticket._id.toString());
    if (!found) {
      throw new Error('Test ticket not present in user tickets result');
    }
    if (!found.eventId || !found.eventId.title) {
      throw new Error('Ticket eventId was not populated with title');
    }
    if (!found.bookingId || !found.bookingId.bookingId) {
      throw new Error('Ticket bookingId was not populated with readable bookingId');
    }
    console.log(`✓ PASS: Event title "${found.eventId.title}" & bookingId "${found.bookingId.bookingId}" correctly populated\n`);
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 1:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // Test 2: generateQrToken generates valid signed JWT for owner
  // ---------------------------------------------------------------------------
  let liveToken = null;
  try {
    console.log('--- Test 2: generateQrToken (Owner check & Token structure) ---');
    // Ensure ticket is valid status
    ticket.status = 'valid';
    await ticket.save();

    const res = await generateQrToken(user._id, ticket._id);
    if (!res.qrToken || !res.expiresIn) {
      throw new Error('Expected qrToken and expiresIn in result');
    }
    liveToken = res.qrToken;
    console.log(`✓ Issued short-lived QR token: ${liveToken.slice(0, 24)}... (expiresIn: ${res.expiresIn}s)`);

    // Verify decode
    const decoded = jwt.decode(liveToken);
    if (decoded.ticketId !== ticket._id.toString() || decoded.eventId !== ticket.eventId.toString()) {
      throw new Error('Token payload missing ticketId or eventId match');
    }
    console.log(`✓ Token payload contains ticketId: ${decoded.ticketId}, eventId: ${decoded.eventId}`);

    // Attempt generation with non-owner
    try {
      await generateQrToken(otherUser._id, ticket._id);
      throw new Error('Should have thrown 403 for non-owner');
    } catch (ownerErr) {
      if (ownerErr.statusCode === 403) {
        console.log('✓ Rejected non-owner request with 403 Forbidden');
      } else {
        throw ownerErr;
      }
    }

    console.log('✓ PASS: Valid owner token generated and non-owner denied\n');
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 2:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // Test 3: verifyQrToken on a valid token
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 3: verifyQrToken (Valid token verification) ---');
    const result = await verifyQrToken(liveToken);
    if (!result.valid) {
      throw new Error(`Expected valid: true, got error: ${result.error}`);
    }
    if (result.ticket._id.toString() !== ticket._id.toString()) {
      throw new Error('Returned ticket does not match token ticket');
    }
    console.log(`✓ PASS: Valid token verified successfully for ticket code ${result.ticket.ticketCode}\n`);
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 3:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // Test 4: verifyQrToken on a forged token
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 4: verifyQrToken (Forged signature check) ---');
    const forgedToken = jwt.sign(
      { ticketId: ticket._id.toString(), eventId: ticket.eventId.toString() },
      'wrong_secret_attacker_key',
      { expiresIn: '30s' }
    );
    const result = await verifyQrToken(forgedToken);
    if (result.valid || !result.error?.includes('Invalid token signature')) {
      throw new Error(`Expected invalid token signature, got: ${JSON.stringify(result)}`);
    }
    console.log(`✓ PASS: Forged token rejected with: "${result.error}"\n`);
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 4:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // Test 5: verifyQrToken on an expired token
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 5: verifyQrToken (Expired token check) ---');
    const expiredToken = jwt.sign(
      { ticketId: ticket._id.toString(), eventId: ticket.eventId.toString() },
      config.qrSecret,
      { expiresIn: '0s' } // immediately expired
    );
    // slight delay to guarantee expiry
    await wait(50);
    const result = await verifyQrToken(expiredToken);
    if (result.valid || result.error !== 'Token expired') {
      throw new Error(`Expected 'Token expired', got: ${JSON.stringify(result)}`);
    }
    console.log(`✓ PASS: Expired token rejected with: "${result.error}"\n`);
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 5:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // Test 6: Refusal on used and cancelled tickets
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 6: Refuse used or cancelled tickets ---');
    // Test 'used' ticket
    ticket.status = 'used';
    await ticket.save();

    try {
      await generateQrToken(user._id, ticket._id);
      throw new Error('Should have refused QR token generation for used ticket');
    } catch (e) {
      if (e.statusCode === 400 && e.message.includes('used')) {
        console.log('✓ generateQrToken refused used ticket with 400');
      } else {
        throw e;
      }
    }

    // Also verify verifyQrToken catches used ticket
    const tempToken = jwt.sign(
      { ticketId: ticket._id.toString(), eventId: ticket.eventId.toString() },
      config.qrSecret,
      { expiresIn: '30s' }
    );
    const verifyUsed = await verifyQrToken(tempToken);
    if (verifyUsed.valid || !verifyUsed.error?.includes('already used')) {
      throw new Error(`Expected 'Ticket already used', got: ${JSON.stringify(verifyUsed)}`);
    }
    console.log('✓ verifyQrToken refused used ticket with: "Ticket already used"');

    // Test 'cancelled' ticket
    ticket.status = 'cancelled';
    await ticket.save();
    try {
      await generateQrToken(user._id, ticket._id);
      throw new Error('Should have refused QR token generation for cancelled ticket');
    } catch (e) {
      if (e.statusCode === 400 && e.message.includes('cancelled')) {
        console.log('✓ generateQrToken refused cancelled ticket with 400');
      } else {
        throw e;
      }
    }

    // Reset status back to valid
    ticket.status = 'valid';
    await ticket.save();

    console.log('✓ PASS: Used and cancelled tickets rejected at both token issue and verification\n');
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 6:', err.message);
    failed++;
  }

  console.log('=============================================');
  console.log(`  M5 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('=============================================\n');

  if (redisClient) {
    await redisClient.quit().catch(() => {});
  }
  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(async (err) => {
  console.error('Fatal test error:', err);
  if (redisClient) await redisClient.quit().catch(() => {});
  await mongoose.disconnect();
  process.exit(1);
});
