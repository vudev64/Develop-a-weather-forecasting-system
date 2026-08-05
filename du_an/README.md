# 🌤️ Weather App - Full Stack (MERN)

Ứng dụng dự báo thời tiết Full Stack chuyên nghiệp, bảo mật và đạt chuẩn Production, được xây dựng với React (Frontend) + Express + MongoDB (Backend).

## 📁 Cấu trúc dự án

text
weather-app/
├── frontend/           # React + Vite (UI/UX Tối giản, Leaflet Map, Auth UI)
│   ├── src/
│   ├── public/
│   └── package.json    # Đã tích hợp kill-port 5173
├── backend/            # Express + MongoDB (Auth, Weather Services)
│   ├── config/         # Winston Logger, DB Connection
│   ├── controllers/    # Xử lý logic Auth, Weather, Favorites
│   ├── middleware/     # Auth JWT, Rate Limiter, Error Handler
│   ├── models/         # User, History, Favorite Models
│   ├── routes/         # API Routes
│   └── server.js       # App entrypoint
└── package.json        # Root package manager (Điều khiển cả Frontend & Backend)

* Tính năng Nổi bật
🔐 Xác thực & Bảo mật (Auth System):

- Đăng ký / Đăng nhập bằng Email & Mật khẩu.

- Tích hợp Google OAuth 2.0.

- Khôi phục & Đặt lại mật khẩu qua Mã OTP gửi về Email.

- Duy trì phiên làm việc thông minh với JWT Session (chống logout / văng app khi mất mạng).

- Anti-spam bằng Rate Limiting.

🌤️ Dự báo thời tiết:

- Tìm kiếm & hiển thị chỉ số thời tiết real-time (nhiệt độ, độ ẩm, áp suất, tốc độ gió, vị trí bản đồ).

- Tự động lưu và quản lý lịch sử tìm kiếm vào MongoDB.

❤️ Quản lý Yêu thích (Favorites):

- Đồng bộ danh sách địa điểm yêu thích theo từng tài khoản trên MongoDB.

* Hệ thống Backend chuẩn Production:

- Structured Logging: Ghi log hệ thống dạng JSON chuyên nghiệp bằng Winston.

- Centralized Error Handling: Middleware bắt lỗi tập trung, ghi log chi tiết, không làm crash server.

- CORS Whitelist linh hoạt theo môi trường.

## 🚀 Cài đặt và chạy

### Bước 1: Cài đặt dependencies
```bash
npm run install-all
```

### Bước 2: Cấu hình file `.env`

Copy file mẫu rồi chỉnh lại port theo nhu cầu dev:

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

Tạo hoặc sửa file `backend/.env` với nội dung:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/weather_app
WEATHER_API_KEY=your_openweathermap_api_key
WEATHER_API_URL=https://api.openweathermap.org/data/2.5/weather
FRONTEND_URL=http://localhost:5173
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

Tạo hoặc sửa file `frontend/.env` với nội dung:
```env
VITE_PORT=5173
VITE_API_BASE_URL=http://localhost:5000/api
```

Đổi port dev như sau:

- đổi frontend: sửa `VITE_PORT` trong `frontend/.env`
- đổi backend: sửa `PORT` trong `backend/.env`
- nếu đổi frontend port, cập nhật `FRONTEND_URL` trong `backend/.env` để CORS khớp

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

- **Frontend:** theo `VITE_PORT` trong `frontend/.env`
- **Backend API:** theo `PORT` trong `backend/.env`

## 🔧 API Endpoints

### Weather
- `GET /api/weather/:city` - Lấy thời tiết của thành phố
- `GET /api/weather/history/:city` - Lịch sử thời tiết
- `GET /api/weather/cities/all` - Danh sách thành phố đã tìm

### Users
- `POST /api/users/login` - Đăng nhập
- `POST /api/users/search-history` - Lưu lịch sử tìm kiếm
- `POST /api/users/request-otp` - Yêu cầu gửi OTP quên mật khẩu
- `POST /api/users/verify-otp` - Xác thực mã OTP
- `POST /api/users/reset-password` - Đặt lại mật khẩu mới
- `POST /api/users/search-history` - Lưu lịch sử tìm kiếm
- `GET /api/users/favorites` - Lấy danh sách địa điểm yêu thích (Protected)
- `POST /api/users/favorites` - Thêm địa điểm vào danh sách yêu thích (Protected)
- `DELETE /api/users/favorites/:cityName` - Xóa địa điểm khỏi danh sách yêu thích

## 🎯 Tính năng

- **Auth:** Đăng ký/Đăng nhập, Google OAuth, Email OTP, JWT Session không văng khi rớt mạng.
- **Thời tiết:** Tìm kiếm chỉ số real-time, tích hợp bản đồ & cache MongoDB tối ưu speed.
- **Đồng bộ:** Lưu lịch sử tìm kiếm và danh sách địa điểm yêu thích theo tài khoản.
- **Bảo mật:** Rate Limiting chống spam API & Winston Logger ghi log JSON chuẩn Production.

## 📝 Ghi chú

- **Bảo mật API:** Frontend chỉ gọi Backend; API Key được giấu an toàn ở server.
- **Tự động hóa:** Tự kill-port `5173` khi khởi chạy Frontend.
- **Xử lý lỗi:** Middleware bắt lỗi tập trung, không crash server.
