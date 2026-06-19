import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './Map.css'
import TemperatureLayer from './components/layers/TemperatureLayer'
import WindLayer from './components/layers/WindLayer'
import RainfallLayer from './components/layers/RainfallLayer'
import HumidityLayer from './components/layers/HumidityLayer'

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
function MapClickHandler({ onClickLocation }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      
      try {
        const response = await fetch(`http://localhost:5000/api/weather/coordinates?lat=${lat}&lon=${lng}`);
        const data = await response.json();
        
        if (data.success) {
          const weatherData = {
            ...data.data,
            temperature: Math.round(data.data.current.temperature),
            feelsLike: Math.round(data.data.current.feelsLike),
            humidity: data.data.current.humidity,
            windSpeed: data.data.current.windSpeed,
            windDirection: data.data.current.windDirection,
            windGust: data.data.current.windGust,
            precipitation: data.data.current.precipitation,
            weatherCode: data.data.current.weatherCode,
          };
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

function Map({ weather }) {
  const [layerConfig] = useState({
    temperature: false,
    wind: false,
    rainfall: false,
    humidity: false,
    opacity: 0.7,
    windStyle: 'arrows'
  })
  const [clickedLocation, setClickedLocation] = useState(null)

  if (!weather || !weather.latitude || !weather.longitude) {
    return <div className="map-container">Không có dữ liệu vị trí</div>
  }

  const position = [weather.latitude, weather.longitude]
  const tempColor = getTemperatureColor(weather.temperature)
  const windIcon = getWindIcon(weather.windDirection || 0)

  // Lấy dữ liệu dự báo 24h tiếp theo từ hourly data
  const getNext24HourForecast = () => {
    if (!weather?.hourly?.time) return [];
    const forecast = [];
    for (let i = 0; i < Math.min(24, weather.hourly.time.length); i++) {
      forecast.push({
        time: weather.hourly.time[i],
        temp: weather.hourly.temperature_2m?.[i] || weather.temperature,
        precipitation: weather.hourly.precipitation?.[i] || 0,
        windSpeed: weather.hourly.wind_speed_10m?.[i] || weather.windSpeed || 0,
        visibility: weather.hourly.visibility?.[i] || 0
      });
    }
    return forecast;
  }

  const hourly24 = getNext24HourForecast();

  const formatTime = (timeString) => {
    const date = new Date(timeString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="map-wrapper">
      <div className="map-header">
        <h3>🗺️ Bản đồ Thời Tiết: {weather.city}, {weather.country}</h3>
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

        {/* Weather Layers - Các lớp dữ liệu thời tiết */}
        {layerConfig.temperature && (
          <TemperatureLayer 
            weather={weather} 
            visible={true}
            opacity={layerConfig.opacity}
          />
        )}
        
        {layerConfig.wind && (
          <WindLayer 
            weather={weather} 
            visible={true}
            style={layerConfig.windStyle || 'arrows'}
            opacity={layerConfig.opacity}
          />
        )}
        
        {layerConfig.rainfall && (
          <RainfallLayer 
            weather={weather} 
            visible={true}
            opacity={layerConfig.opacity}
          />
        )}

        {layerConfig.humidity && (
          <HumidityLayer 
            weather={weather} 
            visible={true}
            opacity={layerConfig.opacity}
          />
        )}

        {/* Circle hiển thị vùng ảnh hưởng nhiệt độ */}
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

        {/* Map Click Handler - Xử lý click trên bản đồ */}
        <MapClickHandler onClickLocation={setClickedLocation} />

        {/* Marker chính */}
        <Marker position={position}>
          <Popup>
            <div className="weather-popup">
              <div className="popup-header">
                <strong>📍 {weather.city}</strong>
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

        {/* Marker cho clicked location */}
        {clickedLocation && (
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
                  <strong>📍 {clickedLocation.weather.city}</strong>
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

      {/* Dự báo từng giờ */}
      {hourly24.length > 0 && (
        <div className="forecast-section">
          <h4>📊 Dự báo 24 giờ tiếp theo</h4>
          <div className="forecast-scroll">
            {hourly24.slice(0, 24).map((item, idx) => (
              <div key={idx} className="forecast-item">
                <div className="forecast-time">{formatTime(item.time)}</div>
                <div className="forecast-temp">{Math.round(item.temp)}°C</div>
                <div className="forecast-wind">💨 {item.windSpeed.toFixed(1)} m/s</div>
                <div className="forecast-rain">🌧️ {item.precipitation.toFixed(1)} mm</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default Map