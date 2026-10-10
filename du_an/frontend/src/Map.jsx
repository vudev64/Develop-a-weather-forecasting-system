import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './Map.css'
import TemperatureLayer from './components/layers/TemperatureLayer'
import WeatherAnimationOverlay from './components/layers/WeatherAnimationOverlay.jsx'
import HumidityLayer from './components/layers/HumidityLayer'
import { mapWeatherResponse as normalizeWeatherResponse, weatherService } from './services/weatherService.js'
import WeatherForecast from './components/dashboard/WeatherForecast.jsx'

// Fix marker icon issue in react-leaflet
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

// Hàm xác định màu sắc dựa trên nhiệt độ - giống như Windy
const getTemperatureColor = (temp) => {
  if (temp <= -10) return '#4575b4' // Xanh đậm - lạnh cực
  if (temp <= 0) return '#74add1'  // Xanh nhạt - lạnh
  if (temp <= 10) return '#abd9e9' // Xanh nhạt hơn
  if (temp <= 20) return '#e0f3f8' // Xanh rất nhạt
  if (temp <= 25) return '#ffffbf' // Vàng - ấm
  if (temp <= 30) return '#fee090' // Vàng cam
  if (temp <= 35) return '#fdae61' // Cam
  if (temp <= 40) return '#f46d43' // Đỏ cam
  return '#d73027' // Đỏ - nóng cực
}

// Hàm lấy icon gió dựa trên hướng gió
const getWindIcon = (direction) => {
  const arrows = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];
  const index = Math.round((direction % 360) / 45) % 8;
  return arrows[index];
}

// Component xử lý click trên bản đồ
function MapClickHandler({ onClickLocation, enabled = true }) {
  useMapEvents({
    click: async (e) => {
      if (!enabled) return

      const { lat, lng } = e.latlng;
      
      try {
        const data = await weatherService.getWeatherByCoordinates(lat, lng);
        
        if (data.success) {
          const weatherData = normalizeWeatherResponse(data);
          onClickLocation({
            lat,
            lng,
            weather: weatherData
          });
        }
      } catch (error) {
        console.error('Lỗi khi lấy dữ liệu thời tiết:', error);
      }
    }
  });
  
  return null;
}

// 🟢 Nhận weather và layerConfig truyền trực tiếp từ Dashboard.jsx
function Map({ weather, layerConfig = {}, showWeatherDetails = true, showForecast = true }) {
  const [clickedLocation, setClickedLocation] = useState(null)

  if (!weather || weather.latitude == null || weather.longitude == null) {
    return <div className="map-container">Không có dữ liệu vị trí</div>
  }

  const position = [weather.latitude, weather.longitude]
  const tempColor = getTemperatureColor(weather.temperature)
  const windIcon = getWindIcon(weather.windDirection || 0)
  const locationLabel = showWeatherDetails && weather.country
    ? `${weather.city}, ${weather.country}`
    : weather.city

  return (
    <div className={`map-wrapper ${showWeatherDetails ? '' : 'public-map-expanded'}`} id="weather-map">
      <div className="map-header">
        <div>
          <p className="eyebrow">KHÁM PHÁ ĐỊA ĐIỂM</p>
          <h3>Thời tiết trên bản đồ</h3>
          <p className="map-location">{locationLabel}</p>
          {showWeatherDetails && (
            <p className="map-interaction-hint">
              Nhấp vào bản đồ để xem thời tiết tại một vị trí khác
            </p>
          )}
          {showWeatherDetails && (
            <p className="map-simulation-note">
              Hiệu ứng thời tiết mô phỏng theo dữ liệu tại vị trí đang chọn, không phải dữ liệu phủ toàn bản đồ.
            </p>
          )}
        </div>
        {showWeatherDetails && (
          <div className="weather-legend">
            <div className="legend-item">
              <span className="legend-label">🌡️ Nhiệt độ:</span>
              <span className="legend-value" style={{color: tempColor, fontWeight: 'bold'}}>
                {weather.temperature}°C
              </span>
            </div>
            <div className="legend-item">
              <span className="legend-label">💨 Gió:</span>
              <span className="legend-value">{windIcon} {weather.windSpeed.toFixed(1)} m/s</span>
            </div>
            <div className="legend-item">
              <span className="legend-label">💧 Độ ẩm:</span>
              <span className="legend-value">{weather.humidity}%</span>
            </div>
            <div className="legend-item">
              <span className="legend-label">🌧️ Mưa:</span>
              <span className="legend-value">{weather.precipitation} mm</span>
            </div>
          </div>
        )}
      </div>

      <MapContainer 
        center={position} 
        zoom={10} 
        className="map-container"
      >
        {/* OpenStreetMap base layer */}
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Weather Layers - Hiển thị theo layerConfig nhận từ Dashboard */}
        {layerConfig.temperature && (
          <TemperatureLayer 
            weather={weather} 
            visible={true}
            opacity={layerConfig.opacity}
          />
        )}
        
        <WeatherAnimationOverlay
          weather={weather}
          location={position}
          windEnabled={Boolean(layerConfig.wind)}
          rainEnabled={Boolean(layerConfig.rainfall)}
          opacity={layerConfig.opacity}
        />

        {layerConfig.humidity && (
          <HumidityLayer 
            weather={weather} 
            visible={true}
            opacity={layerConfig.opacity}
          />
        )}

        {/* Circle hiển thị vùng ảnh hưởng nhiệt độ */}
        {showWeatherDetails && (
          <Circle 
            center={position} 
            radius={50000} 
            pathOptions={{ 
              color: tempColor, 
              fill: true, 
              fillOpacity: 0.1,
              weight: 2
            }} 
          />
        )}

        {/* Map Click Handler - Xử lý click trên bản đồ */}
        <MapClickHandler
          onClickLocation={setClickedLocation}
          enabled={showWeatherDetails}
        />

        {/* Marker chính chỉ hiển thị sau khi đăng nhập */}
        {showWeatherDetails && (
          <Marker position={position}>
            <Popup>
              <div className="weather-popup">
                <div className="popup-header">
                  <strong>{weather.city}</strong>
                </div>
                <div className="popup-content">
                  <div className="popup-row">
                    <span>🌡️ Nhiệt độ:</span>
                    <span>{weather.temperature}°C (cảm giác {weather.feelsLike}°C)</span>
                  </div>
                  <div className="popup-row">
                    <span>🌤️ Thời tiết:</span>
                    <span>{weather.description}</span>
                  </div>
                  <div className="popup-row">
                    <span>💨 Gió:</span>
                    <span>{weather.windSpeed.toFixed(1)} m/s {windIcon}</span>
                  </div>
                  <div className="popup-row">
                    <span>🌀 Gió giật:</span>
                    <span>{weather.windGust.toFixed(1)} m/s</span>
                  </div>
                  <div className="popup-row">
                    <span>💧 Độ ẩm:</span>
                    <span>{weather.humidity}%</span>
                  </div>
                  <div className="popup-row">
                    <span>🧭 Hướng gió:</span>
                    <span>{weather.windDirection}°</span>
                  </div>
                  <div className="popup-row">
                    <span>🌧️ Lượng mưa:</span>
                    <span>{weather.precipitation} mm</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Marker cho clicked location */}
        {showWeatherDetails && clickedLocation && (
          <Marker position={[clickedLocation.lat, clickedLocation.lng]} icon={L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          })}>
            <Popup>
              <div className="weather-popup">
                <div className="popup-header">
                  <strong>{clickedLocation.weather.city}</strong>
                  <button 
                    onClick={() => setClickedLocation(null)} 
                    style={{
                      position: 'absolute',
                      right: '5px',
                      top: '5px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '18px'
                    }}
                  >
                    ✕
                  </button>
                </div>
                <div className="popup-content">
                  <div className="popup-row">
                    <span>🌡️ Nhiệt độ:</span>
                    <span>{clickedLocation.weather.temperature}°C (cảm giác {clickedLocation.weather.feelsLike}°C)</span>
                  </div>
                  <div className="popup-row">
                    <span>💨 Gió:</span>
                    <span>{clickedLocation.weather.windSpeed.toFixed(1)} m/s {getWindIcon(clickedLocation.weather.windDirection)}</span>
                  </div>
                  <div className="popup-row">
                    <span>🌀 Gió giật:</span>
                    <span>{clickedLocation.weather.windGust.toFixed(1)} m/s</span>
                  </div>
                  <div className="popup-row">
                    <span>💧 Độ ẩm:</span>
                    <span>{clickedLocation.weather.humidity}%</span>
                  </div>
                  <div className="popup-row">
                    <span>🧭 Hướng gió:</span>
                    <span>{clickedLocation.weather.windDirection}°</span>
                  </div>
                  <div className="popup-row">
                    <span>🌧️ Lượng mưa:</span>
                    <span>{clickedLocation.weather.precipitation} mm</span>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {showWeatherDetails && showForecast && <WeatherForecast weather={weather} />}
    </div>
  )
}

export default Map