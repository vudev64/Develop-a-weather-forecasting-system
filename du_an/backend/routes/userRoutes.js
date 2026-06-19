import express from 'express';
import { login, register, saveSearchHistory, resetPassword } from '../controllers/userController.js';
import requireAuth from '../middleware/auth.js';

const router = express.Router();

// POST /api/users/register - Đăng ký
router.post('/register', register);

// POST /api/users/login - Đăng nhập
router.post('/login', login);

// POST /api/users/reset-password - Đặt lại mật khẩu
router.post('/reset-password', resetPassword);

// POST /api/users/search-history - Lưu lịch sử tìm kiếm (optional - nếu login mới lưu)
router.post('/search-history', saveSearchHistory);

export default router;
