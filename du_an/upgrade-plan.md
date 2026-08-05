# Upgrade Plan — Cần sửa

## High Priority

- [ ] Bổ sung field thiếu trong `User` model: `email`, `googleId`, `picture`, `fullName`, `favorites[]`
- [ ] Implement favorites API: GET/POST/DELETE `/api/users/favorites`
- [ ] Trả `searchHistory` trong `getCurrentUser` (`GET /api/auth/me`)
- [ ] Xóa dead code OTP ở cuối `authController.js`
- [ ] `App.jsx`: chỉ logout khi token hết hạn (401/403), không logout khi lỗi mạng

## Medium Priority

- [ ] Rate limit cho `/api/users/request-otp`, `/login`, `/register`, `/reset-password`
- [ ] Tạo `backend/.env.example`
- [ ] Xóa comment chứa app password trong `authController.js`
- [ ] Rà soát CORS và Google OAuth callback URL (Staging/Production)
- [ ] Structured logging (winston/pino)

## Low Priority

- [ ] Test tự động (Vitest + Supertest)
- [ ] Manual test checklist trước go-live
- [ ] Kiểm tra responsive Mobile/Tablet
- [ ] Cập nhật `README.md`
- [ ] Frontend dev script giải phóng port
- [ ] Empty/error state các màn hình
