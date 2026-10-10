import express from 'express';
import { register, login, getMe, updateMe } from '../controllers/authController.js';
import { protect, requireRole } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.patch('/me', protect, updateMe);

// Example test routes demonstrating role guards
router.get('/organizer-only', protect, requireRole('organizer'), (req, res) => {
  res.json({ success: true, message: 'Welcome Organizer!', user: req.user });
});

router.get('/gate-only', protect, requireRole('gate'), (req, res) => {
  res.json({ success: true, message: 'Welcome Gate Staff!', user: req.user });
});

router.get('/user-only', protect, requireRole('user'), (req, res) => {
  res.json({ success: true, message: 'Welcome Attendee!', user: req.user });
});

export default router;
