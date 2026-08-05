# Hướng Dẫn Refactor và Deploy Dự Án Weather App

## Tóm Tắt Các Thay Đổi Refactor

### 1. Refactor `weatherController.js`
- Thêm hàm `formatWeatherResponse` để loại bỏ code lặp trong việc định dạng phản hồi thời tiết
- Giảm số dòng code và dễ bảo trì hơn

### 2. Cấu Hình Server để Serve Frontend (Production)
- Cập nhật `backend/server.js`:
  - Thêm import `path` và `fileURLToPath` để làm việc với đường dẫn file
  - Thêm logic serve static file từ `frontend/dist` khi ở môi trường production
  - Thêm route catch-all để trả về `index.html` cho SPA React

### 3. Cập Nhật `package.json`
- **Root `package.json`**:
  - Thêm script `start` để chạy backend trực tiếp
  - Thêm script `heroku-postbuild` để build frontend tự động khi deploy lên Heroku
- **Backend `package.json`**:
  - Thêm `engines` để chỉ định phiên bản Node.js (tương thích deploy)

## Hướng Dẫn Chạy Ở Môi Trường Development

### Yêu Cầu
- Node.js >= 18.x
- MongoDB (hoặc MongoDB Atlas)

### Cài Đặt
1. Cài đặt tất cả dependencies:
   ```bash
   npm run install-all
   ```
2. Tạo file `backend/.env` với các biến môi trường:
   - `MONGODB_URI`: URI kết nối MongoDB
   - `JWT_SECRET`: Khóa bí mật cho JWT
   - `GOOGLE_CLIENT_ID`: Client ID cho Google OAuth (nếu dùng)
   - `FRONTEND_URL`: URL của frontend (đặt khớp port frontend dev hiện tại)

### Đổi Port Khi Dev

- Frontend đọc port từ `frontend/.env` qua `VITE_PORT`.
- Backend đọc port từ `backend/.env` qua `PORT`.
- Khi đổi port frontend, nhớ cập nhật `FRONTEND_URL` trong `backend/.env` để CORS và Google callback khớp.
- Không cần sửa code để đổi port dev nữa, chỉ cần đổi biến môi trường.

### Chạy Ở Development
```bash
npm run dev
```
Lệnh này sẽ chạy đồng thời backend và frontend theo port khai báo trong `.env` của từng phần.

## Hướng Dẫn Deploy

### Deploy Lên Heroku

#### 1. Chuẩn Bị
- Đăng ký tài khoản Heroku: https://heroku.com
- Cài đặt Heroku CLI: https://devcenter.heroku.com/articles/heroku-cli

#### 2. Khởi Tạo Git Repository (nếu chưa)
```bash
git init
git add .
git commit -m "Initial commit"
```

#### 3. Tạo App Heroku
```bash
heroku create your-app-name
```

#### 4. Cấu Hình Biến Môi Trường Trên Heroku
```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set JWT_SECRET=your_jwt_secret
heroku config:set GOOGLE_CLIENT_ID=your_google_client_id
heroku config:set FRONTEND_URL=https://your-app-name.herokuapp.com
```

#### 5. Deploy
```bash
git push heroku master
```

### Deploy Lên Vercel (Frontend Riêng)
1. Di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Deploy bằng Vercel CLI:
   ```bash
   vercel
   ```

### Deploy Lên Render (Full Stack)
1. Đăng ký tài khoản Render: https://render.com
2. Tạo một Web Service mới
3. Liên kết repository GitHub của bạn
4. Cấu hình:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Thêm các biến môi trường tương tự Heroku
6. Deploy!
