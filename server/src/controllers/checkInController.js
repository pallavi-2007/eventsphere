import {
  processCheckInScan,
  getRecentScans,
  getOrganizerAttendees,
  getOrganizerCheckInStats
} from '../services/checkInService.js';

/**
 * POST /api/checkin/scan
 * Body: { qrToken, ticketCode, targetEventId }
 * Roles: gate, organizer
 */
export const scanTicketHandler = async (req, res, next) => {
  try {
    const { qrToken, ticketCode, targetEventId } = req.body;
    const staffId = req.user._id;

    if (!qrToken && !ticketCode) {
      return res.status(400).json({
        success: false,
        error: 'Please provide either a QR token or a manual ticket code.'
      });
    }

    const result = await processCheckInScan({
      qrToken,
      ticketCode,
      targetEventId,
      staffId
    });

    const isSuccess = result.result === 'valid';
    return res.status(isSuccess ? 200 : 200).json({
      success: isSuccess,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/checkin/recent
 * Roles: gate, organizer
 */
export const getRecentScansHandler = async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const eventId = req.query.eventId || null;
    const scans = await getRecentScans(limit, eventId);

    return res.json({
      success: true,
      count: scans.length,
      data: scans
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/checkin/organizer/attendees
 * Roles: organizer
 */
export const getOrganizerAttendeesHandler = async (req, res, next) => {
  try {
    const { search, eventId, status } = req.query;
    const attendees = await getOrganizerAttendees(req.user._id, { search, eventId, status });

    return res.json({
      success: true,
      count: attendees.length,
      data: attendees
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/checkin/organizer/stats
 * Roles: organizer
 */
export const getOrganizerCheckInStatsHandler = async (req, res, next) => {
  try {
    const stats = await getOrganizerCheckInStats(req.user._id);

    return res.json({
      success: true,
      data: stats
    });
  } catch (err) {
    next(err);
  }
};
