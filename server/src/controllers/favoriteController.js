import {
  getUserFavorites,
  addFavorite,
  removeFavorite,
  getUserFavoriteIds
} from '../services/favoriteService.js';

/**
 * GET /api/favorites
 * Returns full favorite events populated for the authenticated user.
 */
export const getFavoritesHandler = async (req, res, next) => {
  try {
    const events = await getUserFavorites(req.user._id);
    return res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/favorites/ids
 * Returns array of favorite event ID strings for quick client lookup.
 */
export const getFavoriteIdsHandler = async (req, res, next) => {
  try {
    const ids = await getUserFavoriteIds(req.user._id);
    return res.json({
      success: true,
      data: ids
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/favorites/:eventId
 * Adds an event to the authenticated user's favorites.
 */
export const addFavoriteHandler = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const favorite = await addFavorite(req.user._id, eventId);
    return res.status(201).json({
      success: true,
      message: 'Event added to favorites.',
      data: favorite
    });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/favorites/:eventId
 * Removes an event from the authenticated user's favorites.
 */
export const removeFavoriteHandler = async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const result = await removeFavorite(req.user._id, eventId);
    return res.json({
      success: true,
      message: result.message
    });
  } catch (err) {
    next(err);
  }
};
