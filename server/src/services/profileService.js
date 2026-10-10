import { Ticket } from '../models/Ticket.js';
import { Booking } from '../models/Booking.js';
import { Favorite } from '../models/Favorite.js';

/**
 * Get profile analytics summary for attendee.
 * - total tickets booked
 * - upcoming events (tickets for events with dateTime in future)
 * - total amount spent across confirmed bookings
 * - favorites count
 *
 * @param {string} userId
 * @returns {Promise<{ totalTickets: number, upcomingEvents: number, totalSpent: number, favoritesCount: number }>}
 */
export const getUserProfileSummary = async (userId) => {
  const now = new Date();

  // 1. Total tickets booked by user (valid or used)
  const totalTickets = await Ticket.countDocuments({
    userId,
    status: { $in: ['valid', 'used'] }
  });

  // 2. Upcoming events: count of user's valid tickets where event dateTime >= now
  const userTickets = await Ticket.find({
    userId,
    status: 'valid'
  })
    .populate('eventId', 'dateTime')
    .lean();

  // Count unique upcoming events attendee holds tickets for
  const upcomingEventIdSet = new Set();
  for (const t of userTickets) {
    if (t.eventId?.dateTime && new Date(t.eventId.dateTime) >= now) {
      upcomingEventIdSet.add(t.eventId._id.toString());
    }
  }
  const upcomingEvents = upcomingEventIdSet.size;

  // 3. Total amount spent: sum of booking totals for 'paid' bookings
  const bookings = await Booking.find({
    userId,
    status: 'paid'
  }).select('total').lean();

  const totalSpent = bookings.reduce((sum, b) => sum + (b.total || 0), 0);

  // 4. Favorites count
  const favoritesCount = await Favorite.countDocuments({ userId });

  return {
    totalTickets,
    upcomingEvents,
    totalSpent,
    favoritesCount
  };
};
