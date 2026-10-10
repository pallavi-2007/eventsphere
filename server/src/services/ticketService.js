import jwt from 'jsonwebtoken';
import { Ticket } from '../models/Ticket.js';
import { Event } from '../models/Event.js';
import { Booking } from '../models/Booking.js';
import { config } from '../config/env.js';

/**
 * Get tickets for authenticated user, populated with event details & booking reference,
 * split into upcoming and past by event date.
 *
 * @param {string} userId
 * @returns {Promise<{ upcoming: Array, past: Array, total: number }>}
 */
export const getUserTickets = async (userId) => {
  const tickets = await Ticket.find({ userId })
    .populate('eventId', 'title dateTime venue bannerUrl status category')
    .populate('bookingId', 'bookingId total status createdAt')
    .sort({ createdAt: -1 })
    .lean();

  const now = new Date();
  const upcoming = [];
  const past = [];

  for (const t of tickets) {
    const eventDate = t.eventId?.dateTime ? new Date(t.eventId.dateTime) : null;
    if (eventDate && eventDate < now) {
      past.push(t);
    } else {
      upcoming.push(t);
    }
  }

  // Sort upcoming chronologically ascending (closest event first)
  upcoming.sort((a, b) => {
    const dateA = a.eventId?.dateTime ? new Date(a.eventId.dateTime) : new Date(0);
    const dateB = b.eventId?.dateTime ? new Date(b.eventId.dateTime) : new Date(0);
    return dateA - dateB;
  });

  // Sort past chronologically descending (most recent past event first)
  past.sort((a, b) => {
    const dateA = a.eventId?.dateTime ? new Date(a.eventId.dateTime) : new Date(0);
    const dateB = b.eventId?.dateTime ? new Date(b.eventId.dateTime) : new Date(0);
    return dateB - dateA;
  });

  return {
    upcoming,
    past,
    total: tickets.length
  };
};

/**
 * Generate a short-lived signed JWT (approx 30s) containing ticketId and eventId.
 * Only owner can request. Refuses if ticket is used or cancelled.
 *
 * @param {string} userId
 * @param {string} ticketId
 * @returns {Promise<{ qrToken: string, expiresIn: number }>}
 */
export const generateQrToken = async (userId, ticketId) => {
  const ticket = await Ticket.findById(ticketId);

  if (!ticket) {
    const err = new Error('Ticket not found.');
    err.statusCode = 404;
    throw err;
  }

  // Owner check
  if (ticket.userId.toString() !== userId.toString()) {
    const err = new Error('Access denied. You do not own this ticket.');
    err.statusCode = 403;
    throw err;
  }

  // Refuse if ticket is not valid
  if (ticket.status !== 'valid') {
    const err = new Error(`Ticket is ${ticket.status}. QR token cannot be issued.`);
    err.statusCode = 400;
    throw err;
  }

  const expiresIn = 30; // seconds
  const payload = {
    ticketId: ticket._id.toString(),
    eventId: ticket.eventId.toString(),
    ticketCode: ticket.ticketCode,
    ticketTypeId: ticket.ticketTypeId
  };

  const qrToken = jwt.sign(payload, config.qrSecret, { expiresIn: `${expiresIn}s` });

  return {
    qrToken,
    expiresIn
  };
};

/**
 * Verify a QR token at the gate (used in M6).
 * Checks signature, expiration, and ensures ticket exists and is valid in DB.
 *
 * @param {string} token
 * @returns {Promise<{ valid: boolean, error?: string, ticket?: object, payload?: object }>}
 */
export const verifyQrToken = async (token) => {
  if (!token) {
    return { valid: false, error: 'Token is required' };
  }

  let payload;
  try {
    payload = jwt.verify(token, config.qrSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return { valid: false, error: 'Token expired' };
    }
    return { valid: false, error: 'Invalid token signature' };
  }

  const { ticketId, eventId } = payload;
  if (!ticketId) {
    return { valid: false, error: 'Malformed token payload: missing ticketId' };
  }

  const ticket = await Ticket.findById(ticketId)
    .populate('eventId', 'title dateTime venue status')
    .populate('userId', 'name email');

  if (!ticket) {
    return { valid: false, error: 'Ticket does not exist' };
  }

  // Confirm event matches payload if present
  if (eventId && ticket.eventId?._id?.toString() !== eventId.toString()) {
    return { valid: false, error: 'Ticket event does not match token' };
  }

  if (ticket.status === 'used') {
    return { valid: false, error: 'Ticket already used', ticket };
  }

  if (ticket.status === 'cancelled') {
    return { valid: false, error: 'Ticket has been cancelled', ticket };
  }

  if (ticket.status !== 'valid') {
    return { valid: false, error: `Ticket status is ${ticket.status}`, ticket };
  }

  return {
    valid: true,
    ticket,
    payload
  };
};
