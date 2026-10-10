import { getUserProfileSummary } from '../services/profileService.js';

/**
 * GET /api/profile/summary
 * Returns profile metrics summary for authenticated user.
 */
export const getProfileSummaryHandler = async (req, res, next) => {
  try {
    const summary = await getUserProfileSummary(req.user._id);
    return res.json({
      success: true,
      data: summary
    });
  } catch (err) {
    next(err);
  }
};
