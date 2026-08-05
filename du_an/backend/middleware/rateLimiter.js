import rateLimit from 'express-rate-limit';

// 1. Giới hạn chung cho toàn bộ API (chống DDoS cơ bản)
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 100, // Tối đa 100 yêu cầu/15 phút/IP
  message: {
    success: false,
    error: 'Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau 15 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Giới hạn nghiêm ngặt cho gửi OTP (Chống spam Gmail & tốn tiền SMS/mail)
export const otpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 giờ
  max: 5, // Tối đa 5 lần gửi OTP trong 1 giờ/IP
  message: {
    success: false,
    error: 'Bạn đã yêu cầu gửi OTP quá nhiều lần. Vui lòng thử lại sau 1 giờ.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 3. Giới hạn cho Đăng nhập / Đăng ký / Reset Password (Chống Brute-Force)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: 10, // Tối đa 10 lần thử trong 15 phút/IP
  message: {
    success: false,
    error: 'Quá nhiều thao tác đăng nhập/xác thực thất bại. Vui lòng thử lại sau 15 phút.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});