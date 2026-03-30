# 🔐 Google OAuth Setup Guide

## ❌ Vấn đề hiện tại
`Access blocked: Authorization Error` - Client ID chưa được phép truy cập từ http://localhost:3000

---

## ✅ Các bước cấu hình Google OAuth

### **1️⃣ Tạo Google Cloud Project**

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Đăng nhập Gmail account của bạn
3. Click **"Select a Project"** → **"New Project"**
4. Nhập tên: `Weather App` → Click **"Create"**
5. Chờ project được tạo (~2 phút)

---

### **2️⃣ Enable Google OAuth 2.0 API**

1. Sau khi project được tạo, click vào project đó
2. Tìm thanh search → Nhập **"OAuth consent screen"**
3. Click **"OAuth consent screen"** service
4. Chọn **"External"** → Click **"Create"**
5. Điền thông tin:
   - **App name**: `Weather App`
   - **User support email**: Nhập Gmail của bạn
   - **Developer contact**: Nhập Gmail của bạn
6. Click **"Save and Continue"** (bỏ qua scopes)

---

### **3️⃣ Tạo OAuth 2.0 Client ID**

1. Click **"Credentials"** ở menu bên trái
2. Click **"Create Credentials"** → **"OAuth client ID"**
3. Chọn **"Application type: Web application"**
4. Điền thông tin:
   - **Name**: `Weather App Client`
   - **Authorized JavaScript origins**: Thêm cả 2 URLs này:
     ```
     http://localhost:3000
     http://127.0.0.1:3000
     ```
   - **Authorized redirect URIs**: 
     ```
     http://localhost:3000
     http://localhost:5000/api/auth/google/callback
     ```
5. Click **"Create"** → Copy **Client ID**

---

### **4️⃣ Cập nhật Client ID trong code**

Cập nhật file `frontend/src/main.jsx`:

```javascript
const GOOGLE_CLIENT_ID = 'YOUR_NEW_CLIENT_ID_HERE'
```

Thay `YOUR_NEW_CLIENT_ID_HERE` bằng Client ID vừa copy ở bước 3.

---

### **5️⃣ Enable Google+ API**

1. Click thanh search → Nhập **"Google+ API"**
2. Click vào **"Google+ API"**
3. Click **"Enable"**

---

### **6️⃣ Kiểm tra CORS Backend**

Đảm bảo backend chấp nhận request từ frontend:

**File: `backend/server.js`**
```javascript
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
```

---

## 🧪 Test Google Login

1. **Restart Frontend**:
   ```bash
   npm run dev
   ```

2. **Restart Backend**:
   ```bash
   npm start
   ```

3. Mở http://localhost:3000
4. Click nút "Đăng nhập bằng Google"
5. Chọn Gmail account → Google login sẽ hoạt động! ✅

---

## 🔍 Troubleshooting

| Lỗi | Giải pháp |
|-----|---------|
| `Access blocked: Authorization Error` | Thêm `http://localhost:3000` vào **Authorized JavaScript origins** |
| `popup_blocked_by_browser` | Hãy click nút Google login (không dùng F12 console) |
| `consent_required` | Chắc chắn đã tạo OAuth consent screen |
| Token verification failed | Kiểm tra Backend endpoint `/api/auth/google/verify` nhận request |

---

## 📝 Notes

- **Google Client ID**: Để ở `main.jsx` sau khi test thành công
- **.env Backend**: Không cần thêm Google Client Secret vì chúng ta dùng client-side OAuth
- **Production**: Thay `localhost:3000` bằng domain thực của bạn

---

## ✨ Sau khi cấu hình xong

1. Nhấn "Đăng nhập bằng Google"
2. Chọn Gmail account
3. App tự động đăng nhập & redirect tới Dashboard 🎉

