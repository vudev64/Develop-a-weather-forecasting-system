# 🎯 Hướng Dẫn Kiểm Tra Nhanh - Open-Meteo Integration

## ✅ Kiểm Tra Ứng Dụng

### 1️⃣ Xác Nhận Backend Đang Chạy

**Test API Endpoint:**
```powershell
# Kiểm tra xem API có hoạt động không
Invoke-WebRequest -Uri "http://localhost:5000/api/weather/hanoi" | Select-Object StatusCode, StatusDescription
```

**Kết quả mong đợi:** `StatusCode: 200`

---

### 2️⃣ Truy Cập Ứng Dụng

1. Mở trình duyệt
2. Truy cập: **http://localhost:3001**
3. Đăng nhập hoặc tạo tài khoản
4. Nhập tên thành phố (ví dụ: **Hà Nội**, **Bangkok**, **TP.HCM**)
5. Nhấn **Tìm kiếm**

---

### 3️⃣ Các Tính Năng Sẽ Thấy

#### 🗺️ **Bản Đồ Interactive**
- Marker đỏ tại vị trí thành phố
- Popup khi nhấp vào marker
- Circle xung quanh vị trí (màu sắc dựa trên nhiệt độ)

#### 📊 **Thông Tin Thời Tiết Hiện Tại**
```
- 🌡️  Nhiệt độ: 28°C
- 💧 Độ ẩm: 75%
- 💨 Tốc độ gió: 5.5 m/s
- 🌀 Gió giật: 8.2 m/s
- 🧭 Hướng gió: 180°
- 🌧️  Lượng mưa: 2.5 mm
```

#### 📈 **Dự Báo 24 Giờ**
- Hàng ngang cuộn được
- Hiển thị: Giờ, Nhiệt độ, Gió, Mưa
- Cập nhật mỗi giờ

#### 📊 **Dự Báo 7 Ngày**
- Bấm "▶ Xem chi tiết" để mở rộng
- Hiển thị: UV Index, Lượng mưa, Xác suất mưa, Thời gian mưa

---

### 4️⃣ Dữ Liệu Open-Meteo

**Các tham số được lấy:**
```javascript
// Thời tiết hiện tại
- temperature_2m (Nhiệt độ)
- relative_humidity_2m (Độ ẩm)
- wind_speed_10m (Tốc độ gió)
- wind_gusts_10m (Gió giật)
- wind_direction_10m (Hướng gió)
- precipitation (Lượng mưa)
- apparent_temperature (Cảm giác như)
- weather_code (Mã thời tiết WMO)

// Dữ liệu từng giờ (48 giờ)
- temperature_2m
- precipitation
- visibility (Độ nhìn)
- wind_speed_10m
- wind_gusts_10m

// Dữ liệu hằng ngày (7-14 ngày)
- uv_index_max (UV Index tối đa)
- precipitation_sum (Tổng lượng mưa)
- precipitation_probability_max (Xác suất mưa)
- precipitation_hours (Thời gian mưa)
```

---

## 🧪 Thử Nghiệm Với Các Thành Phố Khác nhau

| Thành Phố | Input |
|-----------|-------|
| Hà Nội, Việt Nam | `hanoi` hoặc `Hà Nội` |
| TP. Hồ Chí Minh | `ho chi minh` hoặc `saigon` |
| Bangkok, Thái Lan | `bangkok` |
| New York, USA | `new york` |
| London, UK | `london` |
| Tokyo, Japan | `tokyo` |
| Sydney, Australia | `sydney` |

---

## 🐛 Khắc Phục Sự Cố

| Vấn Đề | Giải Pháp |
|--------|----------|
| **API trả về lỗi 403** | ✅ Đã sửa - Thêm User-Agent header |
| **Bản đồ không hiển thị** | Kiểm tra console (F12) > Network tab |
| **Không tìm thấy thành phố** | Thử nhập tên tiếng Anh hoặc tên quốc gia |
| **Dữ liệu cũ** | Làm mới trang (F5) |
| **Frontend không kết nối backend** | Kiểm tra PORT: Backend = 5000, Frontend = 3001 |

---

## 📱 API Response Example

**Request:**
```
GET http://localhost:5000/api/weather/hanoi
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
    "timestamp": "2024-03-25T...",
    "hourly": {
      "time": ["2024-03-25T00:00", "2024-03-25T01:00", ...],
      "temperature_2m": [23.5, 23.2, 23.1, ...],
      "precipitation": [0, 0, 0.1, ...],
      ...
    },
    "daily": {
      "time": ["2024-03-25", "2024-03-26", ...],
      "uv_index_max": [2.5, 3.1, ...],
      "precipitation_sum": [2.5, 5.3, ...],
      ...
    }
  }
}
```

---

## 🔄 Quy Trình Hoạt Động

```
1. User nhập tên thành phố
   ↓
2. Frontend gửi request đến: GET /api/weather/{city}
   ↓
3. Backend nhận request
   ↓
4. Backend gọi Nominatim API để lấy tọa độ
   ↓
5. Backend gọi Open-Meteo API với tọa độ
   ↓
6. Open-Meteo trả về dữ liệu thời tiết chi tiết
   ↓
7. Backend xử lý và gửi response về Frontend
   ↓
8. Frontend hiển thị:
   - Thông tin hiện tại
   - Bản đồ Leaflet
   - Dự báo 24 giờ
   - Dự báo 7 ngày
```

---

## 🔐 Bảo Mật

✅ **Không cần API key** - Open-Meteo là miễn phí và công khai
✅ **Không lưu trữ dữ liệu cá nhân** - Chỉ lưu lịch sử tìm kiếm
✅ **HTTPS sẽ được khuyến nghị** - Nếu deploy production

---

## 📊 Hiệu Suất

| Metric | Giá Trị |
|--------|---------|
| Response Time | < 1 giây |
| Data Size | ~50-100 KB |
| Hourly Data Points | 48 |
| Daily Data Points | 7-14 |

---

## 🎓 Học Thêm

- **Open-Meteo Docs:** https://open-meteo.com/en/docs
- **Leaflet Docs:** https://leafletjs.com/
- **Nominatim Docs:** https://nominatim.org/

---

**✨ Ứng dụng của bạn bây giờ đã tích hợp thành công Open-Meteo API!**
