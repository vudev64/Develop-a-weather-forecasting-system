# 🌍 Hướng Dẫn Tích Hợp Open-Meteo API với Leaflet

## 📋 Tóm Tắt Các Thay Đổi

Tôi đã tích hợp thành công **Open-Meteo API** vào ứng dụng dự báo thời tiết của bạn. Open-Meteo là một API thời tiết miễn phí, không cần khóa API, cung cấp dữ liệu thời tiết chi tiết và dự báo chính xác.

### ✅ Những Gì Được Cải Thiện

1. **Dữ liệu thời tiết chi tiết từ Open-Meteo**
2. **Dự báo từng giờ trong 48 giờ tới**
3. **Dự báo hằng ngày trong 7 ngày tới**
4. **Không cần API key hoặc thanh toán**
5. **Bản đồ Leaflet tương tác với dữ liệu thực**

---

## 🔧 Các Tập Tin Đã Được Sửa Đổi

### Backend (Node.js/Express)

#### 📄 `backend/controllers/weatherController.js`
**Thay đổi chính:**
- ✅ Thay thế `getCoordinates()` để sử dụng **Nominatim** (OpenStreetMap Geocoder) thay vì OpenWeatherMap
- ✅ Thêm hàm `getOpenMeteoWeather()` mới để gọi Open-Meteo API
- ✅ Cập nhật `getWeatherByCity()` để sử dụng Open-Meteo
- ✅ Cập nhật `getWindyForecast()` để trả về dữ liệu Open-Meteo chi tiết

**URL API Open-Meteo được sử dụng:**
```
https://api.open-meteo.com/v1/forecast
```

**Dữ liệu được yêu cầu:**
```javascript
{
  current: 'temperature_2m,precipitation,wind_speed_10m,wind_gusts_10m,relative_humidity_2m,apparent_temperature,weather_code,wind_direction_10m',
  hourly: 'temperature_2m,precipitation,visibility,wind_speed_10m,wind_gusts_10m,soil_moisture_3_to_9cm',
  daily: 'uv_index_max,precipitation_sum,precipitation_probability_max,precipitation_hours'
}
```

---

### Frontend (React)

#### 📄 `frontend/src/Dashboard.jsx`
**Thay đổi chính:**
- ✅ Thêm hàm `getWeatherDescription()` để chuyển đổi WMO weather code sang mô tả tiếng Việt
- ✅ Cập nhật để hiển thị đẩy đủ dữ liệu từ Open-Meteo
- ✅ Thêm thông tin chi tiết: tốc độ gió, gió giật, hướng gió, lượng mưa

**Dữ liệu hiển thị:**
- Nhiệt độ hiện tại
- Cảm giác như (apparent temperature)
- Độ ẩm (%)
- Tốc độ gió (m/s)
- Gió giật (m/s)
- Hướng gió (độ)
- Lượng mưa (mm)

#### 📄 `frontend/src/Map.jsx`
**Thay đổi chính:**
- ✅ Thêm **state management** với `useState` cho dự báo
- ✅ Thêm dự báo **24 giờ tiếp theo** từ dữ liệu từng giờ
- ✅ Thêm dự báo **7 ngày** từ dữ liệu hằng ngày
- ✅ Hiển thị chi tiết:
  - 📊 **Dự báo từng giờ:** Giờ, nhiệt độ, gió, mưa
  - 📈 **Dự báo 7 ngày:** UV Index, lượng mưa, xác suất mưa, thời gian mưa

#### 📄 `frontend/src/Map.css`
**Thay đổi chính:**
- ✅ Thêm styles cho `.forecast-section`, `.forecast-item`, `.daily-item`
- ✅ Responsive design cho các thiết bị mobile
- ✅ Animations và hover effects

---

## 🚀 Cách Sử Dụng

### 1⃣ Bắt Đầu Ứng Dụng

**Backend (Terminal 1):**
```bash
cd du_an/backend
npm start
# Server sẽ chạy tại http://localhost:5000
```

**Frontend (Terminal 2):**
```bash
cd du_an/frontend
npm run dev
# App sẽ chạy tại http://localhost:3001
```

### 2⃣ Sử Dụng Ứng Dụng

1. **Mở trình duyệt** và truy cập: `http://localhost:3001`
2. **Đăng nhập** với tài khoản của bạn
3. **Nhập tên thành phố hoặc địa điểm** (ví dụ: "Hà Nội", "TP. Hồ Chí Minh", "Bangkok", v.v.)
4. **Nhấn nút "Tìm kiếm"** hoặc nhấn **Enter**
5. **Xem kết quả:**
   - 📍 Bản đồ Leaflet với marker tại vị trí
   - 📊 Dự báo 24 giờ (cuộn ngang)
   - 📈 Dự báo 7 ngày (bấm "Xem chi tiết" để mở rộng)

---

## 📡 API Endpoints

### Lấy Thời Tiết theo Tên Thành Phố
```
GET /api/weather/:city
```
**Ví dụ:**
```bash
curl http://localhost:5000/api/weather/hanoi
```

**Response:**
```json
{
  "success": true,
  "data": {
    "city": "Hà Nội",
    "country": "Việt Nam",
    "latitude": 21.0285,
    "longitude": 105.8542,
    "temperature": 28,
    "feelsLike": 32,
    "humidity": 75,
    "windSpeed": 5.5,
    "windDirection": 180,
    "windGust": 8.2,
    "precipitation": 2.5,
    "weatherCode": 3,
    "hourly": { ... },
    "daily": { ... },
    "coords": { "lat": 21.0285, "lon": 105.8542 }
  }
}
```

### Lấy Dự Báo Chi Tiết
```
GET /api/weather/windy/:city
```

---

## 🎨 Các Tính Năng Hiển Thị

### 🗺️ Bản Đồ Leaflet
- ✅ Marker tại vị trí đã nhập
- ✅ Circle hiển thị vùng ảnh hưởng (minh họa bằng màu sắc dựa trên nhiệt độ)
- ✅ Popup interactif với thông tin chi tiết
- ✅ Base layer từ OpenStreetMap

### 📊 Dự Báo Từng Giờ
- ✅ Hiển thị 24 giờ tiếp theo
- ✅ Thông tin: Giờ, Nhiệt độ, Gió, Mưa
- ✅ Cuộn ngang để xem thêm

### 📈 Dự Báo 7 Ngày
- ✅ Hiển thị 7 ngày tiếp theo
- ✅ Thông tin: UV Index, Lượng mưa, Xác suất mưa, Thời gian mưa
- ✅ Có thể mở rộng/ẩn chi tiết

---

## 🌐 Open-Meteo API Specification

### Base URL
```
https://api.open-meteo.com/v1/forecast
```

### Parameters
| Parameter | Mô tả |
|-----------|-------|
| `latitude` | Vĩ độ |
| `longitude` | Kinh độ |
| `current` | Dữ liệu thời tiết hiện tại |
| `hourly` | Dữ liệu từng giờ |
| `daily` | Dữ liệu hằng ngày |
| `timezone` | Múi giờ (mặc định: UTC) |

### WMO Weather Codes
| Code | Mô tả |
|------|-------|
| 0 | Trời quang |
| 1-2 | Hầu như trời quang / Có mây |
| 3 | Mây che phủ |
| 45, 48 | Sương mù |
| 51-55 | Mưa nhẹ / vừa / nặng |
| 61-65 | Mưa / Mưa nặng |
| 71-75 | Tuyết |
| 80-82 | Mưa rào |
| 95+ | Giông |

---

## ✨ Ưu Điểm của Open-Meteo API

1. **Miễn phí** - Không cần đăng ký API key
2. **Không giới hạn số lần gọi** - Dân sự sử dụng
3. **Dữ liệu chính xác** - Từ các mô hình dự báo toàn cầu
4. **Dữ liệu chi tiết** - Từng giờ, hằng ngày với nhiều tham số
5. **Hỗ trợ nhiều múi giờ** - Chuyển đổi thời gian tự động

---

## 🔍 Troubleshooting

### Lỗi: "Không tìm thấy thành phố"
- ✅ Kiểm tra tên thành phố có chính xác không
- ✅ Thử nhập tên thành phố tiếng Anh
- ✅ Thêm tên quốc gia (ví dụ: "Hà Nội, Việt Nam")

### Lỗi: CORS
- ✅ Kiểm tra backend server đang chạy
- ✅ Kiểm tra URL API_URL trong Dashboard.jsx

### Dữ liệu không hiển thị trên bản đồ
- ✅ Kiểm tra console của trình duyệt (F12)
- ✅ Kiểm tra network tab để xem response từ API
- ✅ Đảm bảo Leaflet CSS được load đúng

---

## 📝 Ghi Chú Kỹ Thuật

### Geolocation
- **Nominatim** (OpenStreetMap) được sử dụng để chuyển đổi tên thành phố thành tọa độ
- **URL:** `https://nominatim.openstreetmap.org/search`

### Offset Búi
- Dữ liệu được lưu thêm vào MongoDB (tuỳ chọn)
- Nếu MongoDB không có sẵn, ứng dụng vẫn hoạt động bình thường

### Timezone
- Mặc định sử dụng `Asia/Bangkok`
- Hỗ trợ thay đổi múi giờ trong tương lai

---

## 🎯 Các Bước Tiếp Theo (Tuỳ Chọn)

1. **Thêm chức năng lưu địa điểm yêu thích**
2. **Thêm chức năng so sánh thời tiết giữa các thành phố**
3. **Thêm biểu đồ nhiệt độ theo ngày**
4. **Thêm thông báo cảnh báo thời tiết**
5. **Tích hợp với Weather Icon Set**

---

## 📞 Hỗ Trợ

Nếu bạn có bất kỳ câu hỏi hoặc vấn đề, vui lòng:
1. Kiểm tra console (F12) để xem lỗi
2. Kiểm tra Network tab để xem API responses
3. Kiểm tra server logs ở terminal backend

---

**Chúc bạn sử dụng ứng dụng vui vẻ! 🎉**
