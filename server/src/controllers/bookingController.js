import { confirmBooking, getUserBookings, getBookingById } from '../services/bookingService.js';

/**
 * POST /api/bookings/confirm
 * Converts an active Redis hold into a persisted booking + tickets.
 */
export const confirmBookingHandler = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { holdId, paymentId } = req.body;

    if (!holdId) {
      return res.status(400).json({ success: false, error: 'holdId is required.' });
    }

    const { booking, tickets, duplicate } = await confirmBooking(userId, holdId, paymentId);

    return res.status(duplicate ? 200 : 201).json({
      success: true,
      duplicate: duplicate || false,
      message: duplicate
        ? 'Booking already confirmed (idempotent response).'
        : 'Booking confirmed successfully.',
      data: { booking, tickets }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/bookings
 * Returns all bookings for the authenticated user.
 */
export const getMyBookingsHandler = async (req, res, next) => {
  try {
    const bookings = await getUserBookings(req.user._id);
    return res.json({ success: true, count: bookings.length, data: bookings });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/bookings/:bookingId
 * Returns one booking + its tickets (user-owned).
 */
export const getBookingHandler = async (req, res, next) => {
  try {
    const { booking, tickets } = await getBookingById(req.user._id, req.params.bookingId);
    return res.json({ success: true, data: { booking, tickets } });
  } catch (err) {
    next(err);
  }
};

