# 🗺️ Hướng Dẫn Tích Hợp Leaflet Weather Layers

## 📋 Tổng Quan

Dự án này tích hợp một hệ thống layer thời tiết toàn diện vào Leaflet, tương tự như giao diện của [Windy.com](https://www.windy.com). Hệ thống cho phép người dùng xem các dữ liệu thời tiết khác nhau (nhiệt độ, gió, mưa, v.v.) dưới dạng overlay trên bản đồ.

## 🎯 Tính Năng

### Các Layer Có Sẵn:
1. **Temperature Layer** 🌡️ - Hiển thị nhiệt độ dạng heatmap với màu sắc gradient
2. **Wind Layer** 💨 - Hiển thị hướng và tốc độ gió dạng animated arrows hoặc particles
3. **Rainfall Layer** 🌧️ - Hiển thị lượng mưa dự báo dạng color overlay
4. **Humidity Layer** 💧 - Hiển thị độ ẩm không khí dạng heatmap
5. **Layer Control Menu** 📐 - Menu để chuyển đổi giữa các layer

## 🏗️ Cấu Trúc Thư Mục

```
src/
├── components/
│   ├── layers/
│   │   ├── TemperatureLayer.jsx      # Layer hiển thị nhiệt độ
│   │   ├── WindLayer.jsx              # Layer hiển thị gió
│   │   ├── RainfallLayer.jsx          # Layer hiển thị mưa
│   │   └── HumidityLayer.jsx          # Layer hiển thị độ ẩm
│   └── WeatherLayerControl.jsx        # Menu điều khiển layer
│       └── WeatherLayerControl.css
├── utils/
│   ├── weatherColors.js               # Color scales cho các layer
│   └── weatherGridData.js             # Utility functions xử lý grid data
└── Map.jsx                            # Component chính
```

## 🚀 Cách Sử Dụng

### 1. Import các component vào Map.jsx

```javascript
import WeatherLayerControl from './components/WeatherLayerControl'
import TemperatureLayer from './components/layers/TemperatureLayer'
import WindLayer from './components/layers/WindLayer'
import RainfallLayer from './components/layers/RainfallLayer'
import HumidityLayer from './components/layers/HumidityLayer'
```

### 2. Quản Lý State cho Layer

```javascript
const [layerConfig, setLayerConfig] = useState({
  temperature: null,           // Layer hiện tại: 'temperature', 'wind', 'rainfall', 'humidity', etc
  opacity: 60,                 // Độ trong suốt: 0-100
  windStyle: 'arrows'          // Cho wind layer: 'arrows' hoặc 'particles'
})
```

### 3. Thêm Layer Control Menu

```javascript
<WeatherLayerControl 
  activeLayerConfig={layerConfig}
  onLayerChange={setLayerConfig}
/>
```

### 4. Render các Layer trong MapContainer

```javascript
<MapContainer center={position} zoom={10} className="map-container">
  <TileLayer url="..." />
  
  {layerConfig.temperature === 'temperature' && (
    <TemperatureLayer weather={weather} visible={true} />
  )}
  
  {layerConfig.temperature === 'wind' && (
    <WindLayer weather={weather} visible={true} style={layerConfig.windStyle} />
  )}
  
  {layerConfig.temperature === 'rainfall' && (
    <RainfallLayer weather={weather} visible={true} />
  )}
  
  {layerConfig.temperature === 'humidity' && (
    <HumidityLayer weather={weather} visible={true} />
  )}
</MapContainer>
```

## 📊 Dữ Liệu Đầu Vào

Các layer cần dữ liệu từ API Open-Meteo với cấu trúc sau:

```javascript
{
  latitude: number,
  longitude: number,
  timezone: string,
  hourly: {
    time: string[],                    // ISO 8601 timestamps
    temperature_2m: number[],          // Celsius
    wind_speed_10m: number[],          // m/s
    wind_direction_10m: number[],      // 0-360 degrees
    wind_gusts_10m: number[],          // m/s
    precipitation: number[],            // mm
    precipitation_probability: number[], // 0-100 %
    dew_point_2m: number[],            // Celsius
    visibility: number[],               // meters
    weather_code: number[],
    soil_moisture_3_to_9cm: number[]
  },
  daily: {
    time: string[],
    weather_code: number[],
    uv_index_max: number[],
    sunshine_duration: number[],
    sunset: string[],
    sunrise: string[],
    precipitation_sum: number[]        // mm
  }
}
```

## 🎨 Color Scales

Mỗi layer sử dụng color scales riêng định nghĩa trong `weatherColors.js`:

### Temperature Colors:
- <= -30°C: `#341560` (Very cold - purple)
- 0°C: `#74add1` (Cold - blue)
- 15°C: `#dfc97f` (Mild - yellowish)
- 25°C: `#ffb300` (Warm - orange)
- >= 40°C: `#8b0000` (Extreme - dark red)

### Wind Speed Colors (m/s):
- < 2: `#0099ff` (Calm - light blue)
- 2-4: `#00ddff` (Light - cyan)
- 4-6: `#00ff00` (Moderate - green)
- 8-10: `#ffaa00` (Strong - orange)
- > 15: `#8b0000` (Hurricane - dark red)

### Precipitation Colors (mm/hour):
- 0: Transparent
- 0.1-0.5: Light blue (`#b3e5fc`)
- 1-2: Blue (`#4fc3f7`)
- 5-10: Dark blue (`#03a9f4`)
- > 50: Very dark blue (`#01579b`)

## 🔧 Mở Rộng - Thêm Layer Mới

### Ví dụ: Tạo Visibility Layer

1. **Tạo file** `src/components/layers/VisibilityLayer.jsx`:

```javascript
import { useEffect } from 'react'
import { useMap } from 'react-leaflet'
import L from 'leaflet'
import { getVisibilityColor } from '../utils/weatherColors'

function VisibilityLayer({ weather, visible = true }) {
  const map = useMap()

  useEffect(() => {
    if (!visible || !weather || !weather.hourly?.visibility) return

    const visibilityData = weather.hourly.visibility || []

    // Tạo canvas element và render heatmap
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    // ... (tương tự như TemperatureLayer)

    const CanvasLayer = L.GridLayer.extend({
      createTile: function () {
        const tileCanvas = document.createElement('canvas')
        const tileCtx = tileCanvas.getContext('2d')
        tileCanvas.width = tileCanvas.height = 256
        tileCtx.drawImage(canvas, 0, 0)
        return tileCanvas
      }
    })

    const visibilityLayer = new CanvasLayer({ opacity: 0.6 })
    visibilityLayer.addTo(map)

    return () => {
      if (map.hasLayer(visibilityLayer)) {
        map.removeLayer(visibilityLayer)
      }
    }
  }, [map, weather, visible])

  return null
}

export default VisibilityLayer
```

2. **Thêm color function** trong `weatherColors.js`:

```javascript
export const getVisibilityColor = (visibility) => {
  const visKm = visibility / 1000
  if (visKm <= 1) return '#8b0000'   // Very poor
  else if (visKm <= 5) return '#ff0000'   // Poor
  else if (visKm <= 10) return '#ff8c00'  // Moderate
  else if (visKm <= 20) return '#ffff00'  // Good
  else return '#00b050'              // Excellent
}
```

3. **Import vào Map.jsx**:

```javascript
import VisibilityLayer from './components/layers/VisibilityLayer'

{layerConfig.temperature === 'visibility' && (
  <VisibilityLayer weather={weather} visible={true} />
)}
```

4. **Thêm option vào WeatherLayerControl.jsx** trong `layers` array:

```javascript
{
  id: 'visibility',
  name: '👁️ Tầm nhìn',
  icon: '👁️',
  description: 'Tầm nhìn/khả năng thấy'
}
```

## ⚡ Tối Ưu Hiệu Năng

### 1. **Caching Dữ Liệu**

```javascript
// Trong weatherGridData.js
const dataCache = new Map()

export const getOrGenerateGridData = (weather, type) => {
  const cacheKey = `${weather.latitude}-${weather.longitude}-${type}`
  
  if (dataCache.has(cacheKey)) {
    return dataCache.get(cacheKey)
  }
  
  const newData = generateGridPoints(weather, type)
  dataCache.set(cacheKey, newData)
  
  // Clear cache nếu quá 5 items
  if (dataCache.size > 5) {
    const firstKey = dataCache.keys().next().value
    dataCache.delete(firstKey)
  }
  
  return newData
}
```

### 2. **Lazy Loading Layer**

```javascript
// Trong Map.jsx - chỉ tạo layer khi thực sự hiển thị
{layerConfig.temperature === 'temperature' && (
  <Suspense fallback={<div>Loading...</div>}>
    <TemperatureLayer weather={weather} visible={true} />
  </Suspense>
)}
```

### 3. **Optimize Canvas Rendering**

- Sử dụng `requestAnimationFrame` cho animated layers
- Limit update frequency bằng throttling
- Sử dụng Worker threads cho dữ liệu lớn (future enhancement)

### 4. **Memory Management**

```javascript
// Cleanup properly trong useEffect
return () => {
  if (map.hasLayer(tempLayer)) {
    map.removeLayer(tempLayer)
  }
  // Xóa canvas context
  ctx = null
}
```

## 🔗 Tích Hợp với API Windy

### Nếu muốn sử dụng Windy API thay vì Open-Meteo:

1. **Lấy API Key** từ https://www.windy.com/api

2. **Tạo bridge layer** trong `src/utils/windyAdapter.js`:

```javascript
export const fetchWindyData = async (lat, lon, apiKey) => {
  const response = await fetch(
    `https://api.windy.com/api/point-forecast/v2?lat=${lat}&lon=${lon}&key=${apiKey}&model=cadium&parameters=wind,temp,rh,pressure&timestamp=`
  )
  return response.json()
}

// Transform Windy format sang format dự án
export const transformWindyData = (windyData) => {
  return {
    hourly: {
      time: windyData.ts.map(t => new Date(t * 1000).toISOString()),
      wind_speed_10m: windyData.wind.map(w => Math.sqrt(w[0]**2 + w[1]**2)),
      wind_direction_10m: windyData.wind.map(w => Math.atan2(w[0], w[1]) * 180 / Math.PI),
      temperature_2m: windyData.temp,
      // ... map các field khác
    }
  }
}
```

3. **Sử dụng trong component**:

```javascript
useEffect(() => {
  const loadWindyData = async () => {
    const windyData = await fetchWindyData(lat, lon, WINDY_API_KEY)
    const transformedData = transformWindyData(windyData)
    setWeatherData(transformedData)
  }
  loadWindyData()
}, [])
```

## 📱 Responsive Design

- Menu điều khiển layer tự động điều chỉnh cho mobile
- Canvas rendering tối ưu cho các kích thước màn hình khác nhau
- Touch support cho các tương tác giao diện

## 🐛 Troubleshooting

### Layer không hiển thị:
- Kiểm tra `weather` data có đầy đủ các field cần thiết
- Kiểm tra z-index của layer (tăng nếu bị che phủ)
- Debug trong console: `console.log(weather.hourly)`

### Performance lag:
- Giảm opacity của layer
- Tắt các layer không cần thiết
- Dùng particles thay vì arrows cho wind layer (ít update hơn)

### Color không đúng:
- Kiểm tra color scale function
- Verify min/max values cũng cần hợp lý
- Test với data thực từ API

## 📚 Tài Liệu Liên Quan

- [Leaflet Docs](https://leafletjs.com/)
- [React-Leaflet](https://react-leaflet.js.org/)
- [Open-Meteo API](https://open-meteo.com/)
- [Windy API](https://www.windy.com/api)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)

## 📝 Ghi Chú

- Hiện tại, humidity được estimate từ dew point, không phải dữ liệu trực tiếp
- Wind animation sử dụng requestAnimationFrame - tự động pause khi tab không focus
- Color scales có thể customize trong `weatherColors.js`
- Tất cả layers đều hỗ trợ opacity adjustment

---

**Created for Educational & Development Purposes** ✨
