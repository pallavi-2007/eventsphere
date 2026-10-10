import express from 'express';
import authRoutes from './authRoutes.js';
import healthRoutes from './healthRoutes.js';
import eventRoutes from './eventRoutes.js';
import holdRoutes from './holdRoutes.js';
import bookingRoutes from './bookingRoutes.js';
import ticketRoutes from './ticketRoutes.js';
import checkInRoutes from './checkInRoutes.js';
import favoriteRoutes from './favoriteRoutes.js';
import profileRoutes from './profileRoutes.js';

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/events', eventRoutes);
router.use('/holds', holdRoutes);
router.use('/bookings', bookingRoutes);
router.use('/tickets', ticketRoutes);
router.use('/checkin', checkInRoutes);
router.use('/favorites', favoriteRoutes);
router.use('/profile', profileRoutes);

export default router;
