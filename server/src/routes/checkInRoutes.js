import express from 'express';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import {
  scanTicketHandler,
  getRecentScansHandler,
  getOrganizerAttendeesHandler,
  getOrganizerCheckInStatsHandler
} from '../controllers/checkInController.js';

const router = express.Router();

// Gate staff & organizer scan routes
router.post('/scan', protect, requireRole('gate', 'organizer'), scanTicketHandler);
router.get('/recent', protect, requireRole('gate', 'organizer'), getRecentScansHandler);

// Organizer-only routes
router.get('/organizer/attendees', protect, requireRole('organizer'), getOrganizerAttendeesHandler);
router.get('/organizer/stats', protect, requireRole('organizer'), getOrganizerCheckInStatsHandler);

export default router;
