import express from 'express';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import {
  confirmBookingHandler,
  getMyBookingsHandler,
  getBookingHandler
} from '../controllers/bookingController.js';

const router = express.Router();

// All booking routes require authentication (user role)
router.post('/confirm', protect, requireRole('user'), confirmBookingHandler);
router.get('/',          protect, requireRole('user'), getMyBookingsHandler);
router.get('/:bookingId', protect, requireRole('user'), getBookingHandler);

export default router;
