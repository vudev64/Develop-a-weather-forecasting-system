import express from 'express';
import { 
  login, 
  register, 
  saveSearchHistory, 
  requestPasswordReset,
  resetPassword,
  getFavorites,
  addFavorite,
  removeFavorite
} from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js'; 
import { passwordResetLimiter, authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// 1. PUBLIC ROUTES
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/request-password-reset', passwordResetLimiter, requestPasswordReset);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/search-history', saveSearchHistory);

// 2. PROTECTED ROUTES (Favorites API)
router.get('/favorites', requireAuth, getFavorites);
router.post('/favorites', requireAuth, addFavorite);
router.delete('/favorites/:cityName', requireAuth, removeFavorite);

export default router;