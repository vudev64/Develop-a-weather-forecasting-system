import express from 'express';
import { 
  login, 
  register, 
  saveSearchHistory, 
  requestOtp, 
  verifyOtp, 
  resetPassword,
  getFavorites,
  addFavorite,
  removeFavorite
} from '../controllers/userController.js';
import { requireAuth } from '../middleware/auth.js'; 
import { otpLimiter, authLimiter } from '../middleware/rateLimiter.js'; 

const router = express.Router();

// 1. PUBLIC ROUTES (Gắn Auth/OTP Limiter)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/request-otp', otpLimiter, requestOtp); // 🛡️ Giới hạn gửi OTP
router.post('/verify-otp', authLimiter, verifyOtp);
router.post('/reset-password', authLimiter, resetPassword);
router.post('/search-history', saveSearchHistory);

// 2. PROTECTED ROUTES (Favorites API)
router.get('/favorites', requireAuth, getFavorites);
router.post('/favorites', requireAuth, addFavorite);
router.delete('/favorites/:cityName', requireAuth, removeFavorite);

export default router;