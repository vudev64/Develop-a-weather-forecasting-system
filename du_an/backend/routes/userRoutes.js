import express from 'express';
import { login, register, saveSearchHistory } from '../controllers/userController.js';

const router = express.Router();

// POST /api/users/register - Đăng ký
router.post('/register', register);

// POST /api/users/login - Đăng nhập
router.post('/login', login);

// POST /api/users/search-history - Lưu lịch sử tìm kiếm
router.post('/search-history', saveSearchHistory);

export default router;
