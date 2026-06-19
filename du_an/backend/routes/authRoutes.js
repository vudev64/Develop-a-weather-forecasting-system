import express from 'express';
import { verifyGoogleToken, getCurrentUser, logout } from '../controllers/authController.js';
import requireAuth from '../middleware/auth.js';

const router = express.Router();

// POST /api/auth/google/verify - Verify Google token từ frontend
router.post('/google/verify', verifyGoogleToken);

// GET /api/auth/me - Get current user (protected)
router.get('/me', requireAuth, getCurrentUser);

// POST /api/auth/logout - Logout
router.post('/logout', requireAuth, logout);

export default router;
