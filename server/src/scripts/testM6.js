/**
 * Milestone M6 Verification Tests:
 * 1. Two simultaneous scans of the same ticket give exactly one 'valid' and one 'already_used'.
 * 2. A forged token signature is rejected.
 * 3. An expired token is rejected.
 * 4. Refuse check-in for a wrong event when targetEventId does not match.
 * 5. Every attempt produces a ScanLog record with correct status and staff reference.
 * 6. Check-in stats, attendees directory, and real dashboard numbers work properly.
 */

import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { redisClient } from '../config/redis.js';
import { User } from '../models/User.js';
import { Event } from '../models/Event.js';
import { Booking } from '../models/Booking.js';
import { Ticket } from '../models/Ticket.js';
import { ScanLog } from '../models/ScanLog.js';
import { config } from '../config/env.js';
import { generateQrToken } from '../services/ticketService.js';
import { processCheckInScan, getRecentScans, getOrganizerAttendees, getOrganizerCheckInStats } from '../services/checkInService.js';
import { getOrganizerStats } from '../services/eventService.js';

async function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('\n=============================================');
  console.log('   EVENTSPHERE - MILESTONE M6 TEST SUITE    ');
  console.log('=============================================\n');

  await connectDB();

  const user = await User.findOne({ email: 'user@eventsphere.com' });
  const gateStaff = await User.findOne({ email: 'gate@eventsphere.com' });
  const organizer = await User.findOne({ email: 'organizer@eventsphere.com' });

  if (!user || !gateStaff || !organizer) {
    throw new Error('Required demo accounts (user, gate, organizer) not found.');
  }

  // Find an event owned by organizer
  let event = await Event.findOne({ organizer: organizer._id });
  if (!event) {
    event = await Event.findOne({ status: 'published' });
    event.organizer = organizer._id;
    await event.save();
  }

  // Create two clean test tickets for this event
  const booking = await Booking.create({
    bookingId: `EVS-M6TEST-${Date.now()}`,
    userId: user._id,
    eventId: event._id,
    ticketTypeId: event.ticketTypes[0]._id.toString(),
    ticketTypeName: event.ticketTypes[0].name,
    quantity: 2,
    unitPrice: 500,
    subtotal: 1000,
    platformFee: 49,
    total: 1049,
    orderId: `ORD-M6-${Date.now()}`,
    paymentId: `PAY-M6-${Date.now()}`,
    status: 'paid',
    eventSnapshot: {
      title: event.title,
      dateTime: event.dateTime,
      venue: event.venue
    }
  });

  const ticket1 = await Ticket.create({
    bookingId: booking._id,
    userId: user._id,
    eventId: event._id,
    ticketTypeId: event.ticketTypes[0]._id.toString(),
    ticketTypeName: event.ticketTypes[0].name,
    ticketCode: `TKT-M6A-${Date.now()}`,
    status: 'valid'
  });

  const ticket2 = await Ticket.create({
    bookingId: booking._id,
    userId: user._id,
    eventId: event._id,
    ticketTypeId: event.ticketTypes[0]._id.toString(),
    ticketTypeName: event.ticketTypes[0].name,
    ticketCode: `TKT-M6B-${Date.now()}`,
    status: 'valid'
  });

  console.log(`Created test tickets: ${ticket1.ticketCode} and ${ticket2.ticketCode} for event "${event.title}"\n`);

  let passed = 0;
  let failed = 0;

  // ---------------------------------------------------------------------------
  // Test 1: Two simultaneous scans of the same ticket give exactly one success
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 1: Concurrency (Two simultaneous scans on same ticket) ---');
    const { qrToken } = await generateQrToken(user._id, ticket1._id);

    const initialLogCount = await ScanLog.countDocuments();

    // Fire both scans in parallel
    const [resA, resB] = await Promise.all([
      processCheckInScan({ qrToken, staffId: gateStaff._id, targetEventId: event._id }),
      processCheckInScan({ qrToken, staffId: gateStaff._id, targetEventId: event._id })
    ]);

    const results = [resA.result, resB.result].sort();
    console.log(`Scan Results: [${resA.result}, ${resB.result}]`);

    if (results[0] !== 'already_used' || results[1] !== 'valid') {
      throw new Error(`Expected exactly one 'valid' and one 'already_used', got: ${JSON.stringify(results)}`);
    }

    // Verify ticket in DB is marked used exactly once
    const updated = await Ticket.findById(ticket1._id);
    if (updated.status !== 'used' || !updated.scannedAt || !updated.scannedBy) {
      throw new Error('Ticket was not properly marked as used in DB');
    }

    // Verify two logs were created
    const finalLogCount = await ScanLog.countDocuments();
    if (finalLogCount - initialLogCount !== 2) {
      throw new Error(`Expected 2 scan logs created, got ${finalLogCount - initialLogCount}`);
    }

    console.log('✓ PASS: Exactly one scan succeeded and second was rejected as already_used with both logged\n');
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 1:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // Test 2: Forged token rejected & logged
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 2: Forged token rejected ---');
    const forgedToken = jwt.sign(
      { ticketId: ticket2._id.toString(), eventId: event._id.toString() },
      'wrong_forged_secret',
      { expiresIn: '30s' }
    );

    const res = await processCheckInScan({ qrToken: forgedToken, staffId: gateStaff._id });
    if (res.result !== 'invalid') {
      throw new Error(`Expected result 'invalid', got: ${res.result}`);
    }

    const log = await ScanLog.findOne({ staffId: gateStaff._id, result: 'invalid' }).sort({ createdAt: -1 });
    if (!log) throw new Error('ScanLog entry was not written for forged attempt');

    console.log(`✓ PASS: Forged token rejected with result "${res.result}" and logged in fraud log\n`);
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 2:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // Test 3: Expired token rejected & logged
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 3: Expired token rejected ---');
    const expiredToken = jwt.sign(
      { ticketId: ticket2._id.toString(), eventId: event._id.toString() },
      config.qrSecret,
      { expiresIn: '0s' }
    );
    await wait(50);

    const res = await processCheckInScan({ qrToken: expiredToken, staffId: gateStaff._id });
    if (res.result !== 'expired') {
      throw new Error(`Expected result 'expired', got: ${res.result}`);
    }

    const log = await ScanLog.findOne({ staffId: gateStaff._id, result: 'expired' }).sort({ createdAt: -1 });
    if (!log) throw new Error('ScanLog entry was not written for expired attempt');

    console.log(`✓ PASS: Expired token rejected with result "${res.result}" and logged in fraud log\n`);
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 3:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // Test 4: Wrong event rejection & Manual ticket check-in
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 4: Wrong event detection & Manual code scan ---');
    const dummyEventId = new mongoose.Types.ObjectId();

    // Scan ticket2 for wrong event
    const wrongRes = await processCheckInScan({
      ticketCode: ticket2.ticketCode,
      targetEventId: dummyEventId,
      staffId: gateStaff._id
    });

    if (wrongRes.result !== 'wrong_event') {
      throw new Error(`Expected 'wrong_event', got: ${wrongRes.result}`);
    }
    console.log(`✓ Rejected scan with wrong event mismatch: "${wrongRes.message}"`);

    // Now scan ticket2 for correct event manually
    const validManualRes = await processCheckInScan({
      ticketCode: ticket2.ticketCode,
      targetEventId: event._id,
      staffId: gateStaff._id
    });

    if (validManualRes.result !== 'valid') {
      throw new Error(`Expected valid manual scan, got: ${validManualRes.result}`);
    }
    console.log('✓ PASS: Manual code scan succeeded for correct event\n');
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 4:', err.message);
    failed++;
  }

  // ---------------------------------------------------------------------------
  // Test 5: Recent scans query & Organizer endpoints
  // ---------------------------------------------------------------------------
  try {
    console.log('--- Test 5: Recent scans, attendees, check-in stats & dashboard numbers ---');
    const recent = await getRecentScans(10);
    if (!Array.isArray(recent) || recent.length === 0) {
      throw new Error('Recent scans returned empty array');
    }
    console.log(`✓ Fetched ${recent.length} recent scan audit entries`);

    // Organizer attendees
    const attendees = await getOrganizerAttendees(organizer._id);
    if (!Array.isArray(attendees) || attendees.length === 0) {
      throw new Error('Organizer attendees returned empty');
    }
    console.log(`✓ Fetched ${attendees.length} organizer attendees`);

    // Search filter test
    const filtered = await getOrganizerAttendees(organizer._id, { search: ticket2.ticketCode });
    if (filtered.length !== 1 || filtered[0].ticketCode !== ticket2.ticketCode) {
      throw new Error('Search filter did not find ticket by code');
    }
    console.log(`✓ Search filter found attendee by ticket code: ${ticket2.ticketCode}`);

    // Check-in stats & fraud log
    const checkInStats = await getOrganizerCheckInStats(organizer._id);
    if (!checkInStats.eventStats || !checkInStats.fraudLogs) {
      throw new Error('CheckInStats must include eventStats and fraudLogs');
    }
    console.log(`✓ Capacity views: ${checkInStats.eventStats.length} events, Fraud log entries: ${checkInStats.fraudLogs.length}`);

    // Real dashboard stats
    const dashStats = await getOrganizerStats(organizer._id);
    if (typeof dashStats.totalAttendees !== 'number' || typeof dashStats.checkInsToday !== 'number') {
      throw new Error('Dashboard stats missing real attendee/checkin numbers');
    }
    console.log(`✓ Organizer Dashboard stats: totalEvents=${dashStats.totalEvents}, totalAttendees=${dashStats.totalAttendees}, checkInsToday=${dashStats.checkInsToday}`);

    console.log('✓ PASS: All organizer endpoints and real stats verified\n');
    passed++;
  } catch (err) {
    console.error('✗ FAIL Test 5:', err.message);
    failed++;
  }

  console.log('=============================================');
  console.log(`  M6 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
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
