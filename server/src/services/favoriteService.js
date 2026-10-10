import mongoose from 'mongoose';
import { Favorite } from '../models/Favorite.js';
import { Event } from '../models/Event.js';
import { attachAvailableQuantities } from './eventService.js';

/**
 * Get all favorite events for a user, populated with available quantities.
 * Returns array of full event objects (same shape as GET /api/events).
 *
 * @param {string} userId
 * @returns {Promise<Array>}
 */
export const getUserFavorites = async (userId) => {
  const favorites = await Favorite.find({ userId })
    .sort({ createdAt: -1 })
    .populate('eventId')
    .lean();

  const validEvents = favorites
    .map(f => f.eventId)
    .filter(evt => evt !== null && evt !== undefined);

  return await Promise.all(validEvents.map(e => attachAvailableQuantities(e)));
};

/**
 * Add an event to user's favorites.
 * Idempotent: adding the same event twice will not duplicate.
 *
 * @param {string} userId
 * @param {string} eventId
 * @returns {Promise<object>}
 */
export const addFavorite = async (userId, eventId) => {
  const event = await Event.findById(eventId);
  if (!event) {
    const error = new Error('Event not found.');
    error.statusCode = 404;
    throw error;
  }

  // Upsert to guarantee no duplicates
  const favorite = await Favorite.findOneAndUpdate(
    { userId, eventId },
    { $setOnInsert: { userId, eventId } },
    { upsert: true, new: true }
  );

  return favorite;
};

/**
 * Remove an event from user's favorites.
 *
 * @param {string} userId
 * @param {string} eventId
 * @returns {Promise<object>}
 */
export const removeFavorite = async (userId, eventId) => {
  await Favorite.findOneAndDelete({ userId, eventId });
  return { success: true, message: 'Event removed from favorites.' };
};

/**
 * Get list of favorite event IDs for a user (lightweight query).
 *
 * @param {string} userId
 * @returns {Promise<Array<string>>}
 */
export const getUserFavoriteIds = async (userId) => {
  const favorites = await Favorite.find({ userId }).select('eventId').lean();
  return favorites.map(f => f.eventId.toString());
};
