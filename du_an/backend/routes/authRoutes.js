import express from 'express';
import { verifyGoogleToken, getCurrentUser, logout } from '../controllers/authController.js';

const router = express.Router();

// POST /api/auth/google/verify - Verify Google token từ frontend
router.post('/google/verify', verifyGoogleToken);

// GET /api/auth/me - Get current user
router.get('/me', getCurrentUser);

// POST /api/auth/logout - Logout
router.post('/logout', logout);

export default router;
