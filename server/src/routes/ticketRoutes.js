import express from 'express';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import { getMyTicketsHandler, getQrTokenHandler } from '../controllers/ticketController.js';

const router = express.Router();

// GET /api/tickets/mine (user only)
router.get('/mine', protect, requireRole('user'), getMyTicketsHandler);

// GET /api/tickets/:id/qr-token (owner only, protected)
router.get('/:id/qr-token', protect, requireRole('user'), getQrTokenHandler);

export default router;
