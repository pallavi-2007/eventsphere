import express from 'express';
import {
  getEvents,
  getSingleEvent,
  getMyEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  getStats
} from '../controllers/eventController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public event routes
router.get('/', getEvents);

// Organizer routes (protected & organizer-only)
router.get('/organizer/my-events', protect, requireRole('organizer'), getMyEvents);
router.get('/organizer/stats', protect, requireRole('organizer'), getStats);
router.post('/', protect, requireRole('organizer'), createEvent);
router.put('/:id', protect, requireRole('organizer'), updateEvent);
router.delete('/:id', protect, requireRole('organizer'), deleteEvent);

// Public single event (must come after specific subpaths)
router.get('/:id', getSingleEvent);

export default router;
