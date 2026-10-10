/**
 * Booking service — wraps the full confirm-booking flow inside one MongoDB
 * transaction.  Redis hold cleanup only happens AFTER the transaction commits.
 *
 * Idempotency: Booking has a unique index on `orderId`.  A duplicate request
 * using the same orderId will hit a MongoDB duplicate-key error (E11000) which
 * we catch and turn into a 200 response with the existing booking.
 */

import mongoose from 'mongoose';
import crypto from 'crypto';
import { Event }   from '../models/Event.js';
import { Booking } from '../models/Booking.js';
import { Ticket }  from '../models/Ticket.js';
import { paymentService } from './paymentService.js';
import { redisClient } from '../config/redis.js';

const PLATFORM_FEE = 49;  // INR — keep in sync with CheckoutPage.jsx

/** Generate a short human-readable booking reference like EVS-20261010-A3F9C12B */
function makeBookingId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = crypto.randomBytes(4).toString('hex').toUpperCase();
  return `EVS-${date}-${rand}`;
}

/** Release all three Redis keys for a hold (fire-and-forget after commit). */
async function releaseHoldKeys(hold) {
  if (!redisClient) return;
  try {
    const pipe = redisClient.pipeline();
    pipe.del(`hold:${hold.holdId}`);
    pipe.srem(`event_holds:${hold.eventId}:${hold.ticketTypeId}`, hold.holdId);
    pipe.del(`user_hold:${hold.userId}:${hold.eventId}`);
    await pipe.exec();
  } catch (err) {
    // Non-fatal — Redis hold will expire on its own TTL
    console.warn('[bookingService] Redis hold cleanup failed (non-fatal):', err.message);
  }
}

/**
 * Confirm a booking.
 *
 * @param {string}  userId      Authenticated user ID.
 * @param {string}  holdId      Redis hold ID the user wants to convert.
 * @param {string}  [paymentId] Payment ID returned by the client/gateway (optional for mock).
 * @returns {object} { booking, tickets }
 */
export const confirmBooking = async (userId, holdId, paymentId) => {
  // ── 1. Load and validate the hold ─────────────────────────────────────────
  if (!redisClient) {
    const err = new Error('Redis is unavailable. Cannot confirm booking without active hold.');
    err.statusCode = 503;
    throw err;
  }

  const raw = await redisClient.get(`hold:${holdId}`);
  if (!raw) {
    // If hold is missing from Redis, check if it was already confirmed into a booking (e.g. repeated submit or retry)
    const existing = await Booking.findOne({ holdId, userId }).lean();
    if (existing) {
      const existingTickets = await Ticket.find({ bookingId: existing._id }).lean();
      return { booking: existing, tickets: existingTickets, duplicate: true };
    }

    const err = new Error('Hold not found or expired. Please select tickets again.');
    err.statusCode = 410;   // 410 Gone — expired, not just missing
    throw err;
  }

  const hold = JSON.parse(raw);
  if (hold.userId !== userId.toString()) {
    const err = new Error('Not authorized to confirm this hold.');
    err.statusCode = 403;
    throw err;
  }

  // ── 2. Create payment order (idempotency key for the booking) ─────────────
  const amountPaise = (hold.totalPrice + PLATFORM_FEE) * 100;
  const { orderId, provider } = await paymentService.createOrder({
    amountPaise,
    currency: 'INR',
    receiptId: holdId
  });

  // ── 3. Confirm / verify payment ───────────────────────────────────────────
  const { paymentId: resolvedPaymentId } = await paymentService.confirmPayment({
    orderId,
    paymentId: paymentId || null
  });

  // ── 4. MongoDB transaction: create Booking + Tickets + decrement quantity ──
  const session = await mongoose.startSession();
  let savedBooking = null;
  let savedTickets = [];

  try {
    await session.withTransaction(async () => {
      // 4a. Load event with session (for write lock)
      const event = await Event.findById(hold.eventId).session(session);
      if (!event) throw Object.assign(new Error('Event not found.'), { statusCode: 404 });

      const tier = event.ticketTypes.id(hold.ticketTypeId);
      if (!tier) throw Object.assign(new Error('Ticket type no longer exists.'), { statusCode: 409 });

      // 4b. Check physical remaining (not holds-adjusted — holds are Redis-side)
      if (tier.remainingQuantity < hold.quantity) {
        throw Object.assign(
          new Error(`Only ${tier.remainingQuantity} ticket(s) remain for "${tier.name}". Please release your hold and try again.`),
          { statusCode: 409 }
        );
      }

      // 4c. Decrement remainingQuantity
      tier.remainingQuantity -= hold.quantity;
      await event.save({ session });

      // 4d. Build booking document
      const subtotal = hold.totalPrice;                // unitPrice × quantity
      const total    = subtotal + PLATFORM_FEE;

      const bookingDoc = new Booking({
        bookingId:     makeBookingId(),
        holdId:        hold.holdId,
        userId:        hold.userId,
        eventId:       hold.eventId,
        ticketTypeId:  hold.ticketTypeId,
        ticketTypeName: hold.ticketTypeName,
        quantity:      hold.quantity,
        unitPrice:     hold.unitPrice,
        subtotal,
        platformFee:   PLATFORM_FEE,
        total,
        orderId,
        paymentId:     resolvedPaymentId,
        paymentProvider: provider,
        status:        'paid',
        eventSnapshot: {
          title:     hold.eventTitle,
          dateTime:  new Date(hold.eventDateTime),
          venue:     hold.eventVenue,
          bannerUrl: hold.eventBanner
        }
      });

      // 4e. Save booking (unique index on orderId/holdId — duplicate request throws E11000)
      savedBooking = await bookingDoc.save({ session });

      // 4f. Create one Ticket per quantity
      const ticketDocs = Array.from({ length: hold.quantity }, () => ({
        bookingId:     savedBooking._id,
        userId:        hold.userId,
        eventId:       hold.eventId,
        ticketTypeId:  hold.ticketTypeId,
        ticketTypeName: hold.ticketTypeName,
        ticketCode:    `TKT-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
        status:        'valid'
      }));

      savedTickets = await Ticket.create(ticketDocs, { session, ordered: true });
    });
  } catch (err) {
    // Idempotency: duplicate orderId or holdId → return the existing booking
    if (err.code === 11000 && (err.keyPattern?.orderId || err.keyPattern?.holdId)) {
      const existing = await Booking.findOne({ $or: [{ orderId }, { holdId: hold.holdId }] }).lean();
      if (existing) {
        const existingTickets = await Ticket.find({ bookingId: existing._id }).lean();
        return { booking: existing, tickets: existingTickets, duplicate: true };
      }
    }
    // Propagate any other error (rolls back transaction automatically)
    throw err;
  } finally {
    await session.endSession();
  }

  // ── 5. Release Redis hold AFTER transaction committed ─────────────────────
  await releaseHoldKeys(hold);

  return { booking: savedBooking.toObject(), tickets: savedTickets.map(t => t.toObject()) };
};

/**
 * Get all bookings for the authenticated user (with event populated).
 */
export const getUserBookings = async (userId) => {
  return Booking.find({ userId })
    .sort({ createdAt: -1 })
    .lean();
};

/**
 * Get a single booking + its tickets, user-owned.
 */
export const getBookingById = async (userId, bookingId) => {
  const booking = await Booking.findOne({ bookingId, userId }).lean();
  if (!booking) {
    const err = new Error('Booking not found.');
    err.statusCode = 404;
    throw err;
  }
  const tickets = await Ticket.find({ bookingId: booking._id }).lean();
  return { booking, tickets };
};
