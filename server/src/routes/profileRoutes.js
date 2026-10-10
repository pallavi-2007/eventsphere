import express from 'express';
import { protect, requireRole } from '../middleware/authMiddleware.js';
import { getProfileSummaryHandler } from '../controllers/profileController.js';

const router = express.Router();

router.get('/summary', protect, requireRole('user'), getProfileSummaryHandler);

export default router;
