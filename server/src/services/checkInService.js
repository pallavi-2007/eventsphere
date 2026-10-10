import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { Ticket } from '../models/Ticket.js';
import { Event } from '../models/Event.js';
import { User } from '../models/User.js';
import { ScanLog } from '../models/ScanLog.js';
import { config } from '../config/env.js';

/**
 * Perform an atomic check-in scan.
 * Handles both QR token (JWT) and manual ticket code.
 *
 * @param {object} params
 * @param {string} [params.qrToken]
 * @param {string} [params.ticketCode]
 * @param {string} [params.targetEventId] - Event ID gate scanner is currently set for
 * @param {string} params.staffId - Authenticated staff / organizer user ID
 * @returns {Promise<object>} Result details
 */
export const processCheckInScan = async ({ qrToken, ticketCode, targetEventId, staffId }) => {
  const method = qrToken ? 'qr' : 'manual';
  const now = new Date();
  let ticketLookupId = null;
  let codeLookup = null;
  let decodedEventId = null;

  // 1. Process QR token if provided
  if (qrToken) {
    let payload;
    try {
      payload = jwt.verify(qrToken, config.qrSecret);
    } catch (err) {
      const isExpired = err.name === 'TokenExpiredError';
      const scanResult = isExpired ? 'expired' : 'invalid';

      // Log attempt
      await ScanLog.create({
        staffId,
        eventId: targetEventId || null,
        result: scanResult,
        method: 'qr',
        rawInput: qrToken.slice(0, 50) + '...',
        metadata: { reason: err.message }
      });

      return {
        result: scanResult,
        message: isExpired ? 'QR token has expired. Please refresh pass.' : 'Invalid QR token signature.'
      };
    }

    ticketLookupId = payload.ticketId;
    decodedEventId = payload.eventId;
    codeLookup = payload.ticketCode;
  } else if (ticketCode) {
    codeLookup = ticketCode.trim().toUpperCase();
  } else {
    return {
      result: 'invalid',
      message: 'Either qrToken or ticketCode must be provided.'
    };
  }

  // 2. Identify the ticket in DB
  const query = ticketLookupId
    ? { _id: ticketLookupId }
    : { ticketCode: codeLookup };

  // Find the ticket to inspect and populate details
  const ticket = await Ticket.findOne(query)
    .populate('eventId', 'title dateTime venue status organizer')
    .populate('userId', 'name email');

  if (!ticket) {
    await ScanLog.create({
      staffId,
      eventId: targetEventId || null,
      ticketCode: codeLookup,
      result: 'invalid',
      method,
      metadata: { reason: 'Ticket does not exist' }
    });

    return {
      result: 'invalid',
      message: 'Ticket not found in the system.'
    };
  }

  const effectiveEventId = ticket.eventId?._id || ticket.eventId;

  // 3. Event check if a target event is specified for the gate
  if (targetEventId && effectiveEventId && effectiveEventId.toString() !== targetEventId.toString()) {
    await ScanLog.create({
      ticketId: ticket._id,
      ticketCode: ticket.ticketCode,
      eventId: effectiveEventId,
      staffId,
      result: 'wrong_event',
      method,
      metadata: {
        expectedEvent: targetEventId,
        ticketEvent: effectiveEventId.toString(),
        eventTitle: ticket.eventId?.title
      }
    });

    return {
      result: 'wrong_event',
      ticket: {
        ticketCode: ticket.ticketCode,
        ticketTypeName: ticket.ticketTypeName,
        eventTitle: ticket.eventId?.title,
        attendeeName: ticket.userId?.name
      },
      message: `Ticket belongs to "${ticket.eventId?.title || 'different event'}", not this event.`
    };
  }

  // 4. ATOMIC check-in update: only updates if status is currently 'valid'
  const updatedTicket = await Ticket.findOneAndUpdate(
    { _id: ticket._id, status: 'valid' },
    {
      $set: {
        status: 'used',
        scannedAt: now,
        scannedBy: staffId
      }
    },
    { new: true }
  )
    .populate('eventId', 'title dateTime venue')
    .populate('userId', 'name email')
    .populate('scannedBy', 'name email');

  if (updatedTicket) {
    // SUCCESSFUL CHECK-IN
    await ScanLog.create({
      ticketId: updatedTicket._id,
      ticketCode: updatedTicket.ticketCode,
      eventId: effectiveEventId,
      staffId,
      result: 'valid',
      method,
      metadata: {
        attendeeName: updatedTicket.userId?.name,
        ticketTypeName: updatedTicket.ticketTypeName
      }
    });

    return {
      result: 'valid',
      ticket: {
        _id: updatedTicket._id,
        ticketCode: updatedTicket.ticketCode,
        ticketTypeName: updatedTicket.ticketTypeName,
        status: updatedTicket.status,
        scannedAt: updatedTicket.scannedAt
      },
      attendee: {
        name: updatedTicket.userId?.name || 'Attendee',
        email: updatedTicket.userId?.email
      },
      event: {
        _id: updatedTicket.eventId?._id,
        title: updatedTicket.eventId?.title,
        venue: updatedTicket.eventId?.venue
      },
      message: 'Admission verified. Welcome to the event!'
    };
  }

  // 5. If findOneAndUpdate did not match, check why (already used or cancelled)
  const currentTicket = await Ticket.findById(ticket._id)
    .populate('scannedBy', 'name email')
    .populate('userId', 'name email')
    .populate('eventId', 'title');

  if (currentTicket.status === 'used') {
    await ScanLog.create({
      ticketId: currentTicket._id,
      ticketCode: currentTicket.ticketCode,
      eventId: effectiveEventId,
      staffId,
      result: 'already_used',
      method,
      metadata: {
        firstScannedAt: currentTicket.scannedAt,
        firstScannedBy: currentTicket.scannedBy?._id
      }
    });

    return {
      result: 'already_used',
      ticket: {
        _id: currentTicket._id,
        ticketCode: currentTicket.ticketCode,
        ticketTypeName: currentTicket.ticketTypeName,
        status: currentTicket.status,
        scannedAt: currentTicket.scannedAt,
        scannedBy: currentTicket.scannedBy
          ? { name: currentTicket.scannedBy.name, email: currentTicket.scannedBy.email }
          : null
      },
      attendee: {
        name: currentTicket.userId?.name || 'Attendee',
        email: currentTicket.userId?.email
      },
      event: {
        title: currentTicket.eventId?.title
      },
      message: `Ticket already used at ${currentTicket.scannedAt ? new Date(currentTicket.scannedAt).toLocaleTimeString() : 'earlier'}${
        currentTicket.scannedBy?.name ? ` by staff ${currentTicket.scannedBy.name}` : ''
      }.`
    };
  }

  // Cancelled or other status
  await ScanLog.create({
    ticketId: currentTicket._id,
    ticketCode: currentTicket.ticketCode,
    eventId: effectiveEventId,
    staffId,
    result: 'invalid',
    method,
    metadata: { status: currentTicket.status }
  });

  return {
    result: 'invalid',
    message: `Ticket is ${currentTicket.status}. Not valid for entry.`
  };
};

/**
 * Get recent scans for gate staff / organizer.
 */
export const getRecentScans = async (limit = 20, eventId = null) => {
  const filter = {};
  if (eventId) {
    filter.eventId = eventId;
  }

  return ScanLog.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('staffId', 'name email')
    .populate('eventId', 'title')
    .populate('ticketId', 'ticketCode ticketTypeName')
    .lean();
};

/**
 * Get organizer attendees across their events with search, event filter, and status filter.
 */
export const getOrganizerAttendees = async (organizerId, { search, eventId, status } = {}) => {
  // 1. Get all events owned by organizer
  const organizerEvents = await Event.find({ organizer: organizerId }).select('_id title').lean();
  const eventIds = organizerEvents.map(e => e._id);

  if (eventIds.length === 0) {
    return [];
  }

  const query = {
    eventId: eventId ? eventId : { $in: eventIds }
  };

  if (status) {
    query.status = status;
  }

  let tickets = await Ticket.find(query)
    .populate('userId', 'name email')
    .populate('eventId', 'title dateTime venue')
    .populate('bookingId', 'bookingId createdAt')
    .sort({ createdAt: -1 })
    .lean();

  if (search && search.trim()) {
    const q = search.trim().toLowerCase();
    tickets = tickets.filter(t => {
      const name = t.userId?.name?.toLowerCase() || '';
      const email = t.userId?.email?.toLowerCase() || '';
      const code = t.ticketCode?.toLowerCase() || '';
      const bookingId = t.bookingId?.bookingId?.toLowerCase() || '';
      const type = t.ticketTypeName?.toLowerCase() || '';
      return name.includes(q) || email.includes(q) || code.includes(q) || bookingId.includes(q) || type.includes(q);
    });
  }

  return tickets;
};

/**
 * Get organizer check-in stats and fraud log.
 */
export const getOrganizerCheckInStats = async (organizerId) => {
  const events = await Event.find({ organizer: organizerId }).lean();
  const eventIds = events.map(e => e._id);

  // Per-event capacity summary
  const eventStats = await Promise.all(
    events.map(async (event) => {
      const totalTickets = event.ticketTypes.reduce((sum, t) => sum + (t.quantity || 0), 0);
      const remainingTickets = event.ticketTypes.reduce((sum, t) => sum + (t.remainingQuantity || 0), 0);
      const bookedCount = totalTickets - remainingTickets;
      const checkedInCount = await Ticket.countDocuments({
        eventId: event._id,
        status: 'used'
      });

      return {
        eventId: event._id,
        title: event.title,
        dateTime: event.dateTime,
        venue: event.venue,
        totalCapacity: totalTickets,
        booked: bookedCount,
        checkedIn: checkedInCount,
        remaining: remainingTickets
      };
    })
  );

  // Fraud log: rejected scans (already_used, invalid, expired, wrong_event)
  const fraudLogs = await ScanLog.find({
    eventId: { $in: eventIds },
    result: { $ne: 'valid' }
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('staffId', 'name email')
    .populate('eventId', 'title')
    .lean();

  return {
    eventStats,
    fraudLogs
  };
};
