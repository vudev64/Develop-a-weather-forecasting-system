# Weather App - Full Stack

Ứng dụng dự báo thời tiết Full Stack với React (Frontend) + Express + MongoDB (Backend)

## 📁 Cấu trúc dự án

```
weather-app/
├── frontend/           # React + Vite
│   ├── src/
│   ├── public/
│   └── package.json
├── backend/           # Express + MongoDB
│   ├── config/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── server.js
└── package.json       # Root (quản lý cả 2)
```

## 🚀 Cài đặt và chạy

### Bước 1: Cài đặt dependencies
```bash
npm run install-all
```

### Bước 2: Cấu hình Backend

Tạo file `backend/.env` với nội dung:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/weather_app
WEATHER_API_KEY=your_openweathermap_api_key
WEATHER_API_URL=https://api.openweathermap.org/data/2.5/weather
```

**Lấy API key miễn phí:** https://openweathermap.org/api

### Bước 3: Đảm bảo MongoDB đang chạy
```bash
mongod
```

### Bước 4: Chạy ứng dụng

**Chạy cả frontend + backend cùng lúc:**
```bash
npm start
```

**Hoặc chạy riêng lẻ:**
```bash
# Frontend only
npm run dev:frontend

# Backend only  
npm run dev:backend
```

## 🌐 URLs

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:5000

## 🔧 API Endpoints

### Weather
- `GET /api/weather/:city` - Lấy thời tiết của thành phố
- `GET /api/weather/history/:city` - Lịch sử thời tiết
- `GET /api/weather/cities/all` - Danh sách thành phố đã tìm

### Users
- `POST /api/users/login` - Đăng nhập
- `POST /api/users/search-history` - Lưu lịch sử tìm kiếm

## 🎯 Tính năng

- ✅ Đăng nhập người dùng
- ✅ Tìm kiếm thời tiết theo thành phố
- ✅ Hiển thị nhiệt độ, độ ẩm, áp suất, tốc độ gió
- ✅ Lưu dữ liệu vào MongoDB
- ✅ Lịch sử tìm kiếm

## 📝 Ghi chú

- Backend sẽ fetch data từ OpenWeatherMap API và lưu vào MongoDB
- Frontend chỉ gọi backend, không gọi trực tiếp API bên ngoài
- Dữ liệu được cache trong database để tối ưu hiệu suất

