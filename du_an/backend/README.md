# Backend - Weather API

## Cài đặt

```bash
cd backend
npm install
```

## Cấu hình

1. Copy file `.env.example` thành `.env`:
```bash
copy .env.example .env
```

2. Sửa `.env` với thông tin của bạn:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/weather_app
WEATHER_API_KEY=your_api_key_here
WEATHER_API_URL=https://api.openweathermap.org/data/2.5/weather
FRONTEND_URL=http://localhost:5173
```

Nếu muốn đổi port backend khi dev, sửa `PORT` trong `backend/.env`.
Nếu frontend đổi port, cập nhật `FRONTEND_URL` cho khớp để CORS không bị chặn.

**Lấy API Key miễn phí tại:** https://openweathermap.org/api

## Chạy server

```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```

## API Endpoints

### Weather
- `GET /api/weather/:city` - Lấy thời tiết theo thành phố
- `GET /api/weather/history/:city` - Lấy lịch sử thời tiết
- `GET /api/weather/cities/all` - Lấy danh sách thành phố đã tìm

### Users
- `POST /api/users/login` - Đăng nhập
- `POST /api/users/search-history` - Lưu lịch sử tìm kiếm

## Yêu cầu

- Node.js 18+
- MongoDB đang chạy trên local hoặc MongoDB Atlas
