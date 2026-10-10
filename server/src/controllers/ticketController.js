import { getUserTickets, generateQrToken } from '../services/ticketService.js';

/**
 * GET /api/tickets/mine
 * Returns user's tickets split into upcoming and past.
 */
export const getMyTicketsHandler = async (req, res, next) => {
  try {
    const result = await getUserTickets(req.user._id);
    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/tickets/:id/qr-token
 * Returns short-lived signed JWT for the requested ticket (owner only).
 */
export const getQrTokenHandler = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await generateQrToken(req.user._id, id);
    return res.json({
      success: true,
      data: result
    });
  } catch (err) {
    next(err);
  }
};
