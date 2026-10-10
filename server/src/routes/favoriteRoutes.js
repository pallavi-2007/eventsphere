import express from 'express';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import {
  getFavoritesHandler,
  getFavoriteIdsHandler,
  addFavoriteHandler,
  removeFavoriteHandler
} from '../controllers/favoriteController.js';

const router = express.Router();

// All favorites endpoints require 'user' role
router.use(protect, requireRole('user'));

router.get('/', getFavoritesHandler);
router.get('/ids', getFavoriteIdsHandler);
router.post('/:eventId', addFavoriteHandler);
router.delete('/:eventId', removeFavoriteHandler);

export default router;
