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

- Khôi phục & Đặt lại mật khẩu bằng link gửi về email.

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

### Bước 2: Cấu hình các file `.env` hiện có

Trong `backend/.env`, giữ các biến Google OAuth hiện có cho Google Login. Gmail API dùng bộ client riêng và refresh token tương ứng:
```env
GMAIL_CLIENT_ID=your_gmail_oauth_client_id
GMAIL_CLIENT_SECRET=your_gmail_oauth_client_secret
GMAIL_REFRESH_TOKEN=your_gmail_oauth_refresh_token
GMAIL_SENDER_EMAIL=your_gmail_address@gmail.com
```

Tạo OAuth refresh token được cấp scope gửi email Gmail API (`https://www.googleapis.com/auth/gmail.send`) và dùng đúng tài khoản Gmail làm `GMAIL_SENDER_EMAIL`. Chỉ cấu hình refresh token ở backend/Render; không đưa secret hoặc refresh token vào frontend. Cấu hình `FRONTEND_URL` là origin giao diện người dùng (ví dụ `http://localhost:5173` khi chạy local). Khi người dùng yêu cầu đặt lại mật khẩu, backend gửi link chứa token ngẫu nhiên một lần; chỉ hash token được lưu trong MongoDB và link hết hạn sau 30 phút.

Vercel cần deploy từ thư mục `frontend` để dùng `frontend/vercel.json`, file này rewrite `/reset-password` về SPA entry point. Trên Render, đặt `FRONTEND_URL` thành origin production chính xác của frontend Vercel (không thêm `/reset-password` hay đường dẫn khác).

`frontend/.env` giữ các biến frontend hiện có, bao gồm:
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
- `POST /api/users/register` - Đăng ký bằng email và mật khẩu
- `POST /api/users/login` - Đăng nhập bằng email và mật khẩu
- `POST /api/users/search-history` - Lưu lịch sử tìm kiếm
- `POST /api/users/request-password-reset` - Gửi link đặt lại mật khẩu tới email tài khoản
- `POST /api/users/reset-password` - Đặt lại mật khẩu bằng token trong link
- `POST /api/users/search-history` - Lưu lịch sử tìm kiếm
- `GET /api/users/favorites` - Lấy danh sách địa điểm yêu thích (Protected)
- `POST /api/users/favorites` - Thêm địa điểm vào danh sách yêu thích (Protected)
- `DELETE /api/users/favorites/:cityName` - Xóa địa điểm khỏi danh sách yêu thích

## 🎯 Tính năng

- **Auth:** Đăng ký/Đăng nhập, Google OAuth, khôi phục mật khẩu qua email, JWT Session không văng khi rớt mạng.
- **Tài khoản:** Email là định danh đăng nhập và địa chỉ nhận link đặt lại mật khẩu; không cần số điện thoại hoặc SMS.
- **Khôi phục mật khẩu:** Backend gửi link một lần qua Gmail API, kiểm tra token và cập nhật mật khẩu MongoDB.
- **Thời tiết:** Tìm kiếm chỉ số real-time, tích hợp bản đồ & cache MongoDB tối ưu speed.
- **Đồng bộ:** Lưu lịch sử tìm kiếm và danh sách địa điểm yêu thích theo tài khoản.
- **Bảo mật:** Rate Limiting chống spam API & Winston Logger ghi log JSON chuẩn Production.

## 📝 Ghi chú

- **Bảo mật API:** Frontend chỉ gọi Backend; API Key được giấu an toàn ở server.
- **Tự động hóa:** Tự kill-port `5173` khi khởi chạy Frontend.
- **Xử lý lỗi:** Middleware bắt lỗi tập trung, không crash server.
