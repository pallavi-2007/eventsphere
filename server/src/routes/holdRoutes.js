import express from 'express';
import { handleCreateHold, handleGetHold, handleReleaseHold } from '../controllers/holdController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

// User only hold endpoints
router.post('/', protect, requireRole('user'), handleCreateHold);
router.get('/:id', protect, requireRole('user'), handleGetHold);
router.delete('/:id', protect, requireRole('user'), handleReleaseHold);

export default router;
