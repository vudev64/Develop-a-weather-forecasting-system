import { useEffect, useState } from 'react'
import './Dashboard.css'
import Map from './Map.jsx'
import UserAvatarMenu from './UserAvatarMenu.jsx' 
import WeatherLayerControl from './components/WeatherLayerControl.jsx'
import { authService } from './services/authService.js'
import { mapWeatherResponse as normalizeWeatherResponse, weatherService } from './services/weatherService.js'

function Dashboard({ username, onLogout }) {
  const [city, setCity] = useState('')
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userInfo, setUserInfo] = useState(null)

  // Quản lý state cho các lớp thời tiết (Layer)
  const [layerConfig, setLayerConfig] = useState({
    temperature: false,
    wind: false,
    rainfall: false,
    humidity: false,
    opacity: 0.7,
    windStyle: 'arrows'
  })

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const data = await authService.getMe()
        setUserInfo(data.data || null)
      } catch {
        setUserInfo(null)
      }
    }

    fetchUserInfo()
  }, [])

  const getWeatherDescription = (code) => {
    const codes = {
      0: 'Trời quang',
      1: 'Hầu như trời quang',
      2: 'Có mây',
      3: 'Mây che phủ',
      45: 'Sương mù',
      48: 'Sương mù rime',
      51: 'Mưa nhẹ',
      53: 'Mưa vừa',
      55: 'Mưa nặng',
      61: 'Mưa',
      63: 'Mưa vừa',
      65: 'Mưa nặng',
      71: 'Tuyết nhẹ',
      73: 'Tuyết vừa',
      75: 'Tuyết nặng',
      80: 'Mưa rào nhẹ',
      81: 'Mưa rào vừa',
      82: 'Mưa rào nặng',
      85: 'Tuyết rào nhẹ',
      86: 'Tuyết rào nặng',
      95: 'Giông',
      96: 'Giông với mưa đá nhẹ',
      99: 'Giông với mưa đá nặng'
    }

    return codes[code] || 'Không xác định'
  }

  const buildWeatherData = (data) => {
    const normalized = normalizeWeatherResponse(data)

    return {
      ...normalized,
      description: getWeatherDescription(normalized.weatherCode),
    }
  }

  const searchWeather = async (targetCity) => {
    const searchTarget = targetCity || city
    if (!searchTarget.trim()) {
      setError('Vui lòng nhập tên thành phố')
      return
    }

    setLoading(true)
    setError('')
    setWeather(null)

    try {
      const data = await weatherService.getWeatherByCity(searchTarget)
      const weatherData = buildWeatherData(data)

      setWeather(weatherData)
      await weatherService.saveSearchHistory(weatherData.city || searchTarget)

    } catch (err) {
      setError(err.message || 'Không thể lấy dữ liệu thời tiết')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchWeather()
    }
  }

  // Chọn nhanh thành phố từ Lịch sử / Yêu thích trong Avatar Menu
  const handleSelectCityFromMenu = (selectedCity) => {
    setCity(selectedCity)
    searchWeather(selectedCity)
  }

  return (
    <div className="dashboard">
      {/* 🟢 CHỈ HIỂN THỊ MENU CONTROL KHI ĐÃ CÓ DỮ LIỆU THỜI TIẾT (TÌM KIẾM THÀNH CÔNG) */}
      {weather && (
        <WeatherLayerControl
          layerConfig={layerConfig}
          onLayerChange={setLayerConfig}
        />
      )}

      {/* Header tối giản: Tiêu đề bên trái, Avatar Menu bên phải */}
      <header className="dashboard-header">
        <h2>🗺️ Bản Đồ Thời Tiết</h2>
        <UserAvatarMenu
          username={username}
          userInfo={userInfo}
          onLogout={onLogout}
          onSelectCity={handleSelectCityFromMenu}
        />
      </header>

      <div className="container">
        <div className="header">
          <h1>Web Dự Báo Thời Tiết</h1>
          
          <div className="search-box">
            <input 
              type="text" 
              placeholder="Nhập tên thành phố hoặc địa điểm..." 
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyPress={handleKeyPress}
            />
            <button onClick={() => searchWeather()} disabled={loading}>
              {loading ? 'Đang tìm...' : 'Tìm kiếm'}
            </button>
          </div>
        </div>

        <div className="content">
          <h2>Xem thông tin thời tiết chi tiết</h2>
          
          <div className="weather-result">
            {error && <p className="error-message">{error}</p>}
            
            {!weather && !error && !loading && (
              <p>Nhập tên thành phố hoặc địa điểm để xem dự báo thời tiết chi tiết</p>
            )}

            {weather && (
              <div className="weather-info">
                <h3>{weather.city}{weather.country && `, ${weather.country}`}</h3>
                <div className="weather-details">
                  <div className="temperature">
                    <span className="temp">{weather.temperature}°C</span>
                  </div>
                  <p className="description">{weather.description}</p>
                  <div className="info-grid">
                    <div className="info-item">
                      <span className="label">Cảm giác như:</span>
                      <span className="value">{weather.feelsLike}°C</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Độ ẩm:</span>
                      <span className="value">{weather.humidity}%</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Tốc độ gió:</span>
                      <span className="value">{weather.windSpeed.toFixed(1)} m/s</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Gió giật:</span>
                      <span className="value">{weather.windGust.toFixed(1)} m/s</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Hướng gió:</span>
                      <span className="value">{weather.windDirection}°</span>
                    </div>
                    <div className="info-item">
                      <span className="label">Lượng mưa:</span>
                      <span className="value">{weather.precipitation} mm</span>
                    </div>
                  </div>
                </div>

                {/* Truyền cấu hình layer xuống cho Map */}
                <Map weather={weather} layerConfig={layerConfig} />
              </div>
            )}
          </div>

          <div className="info-box">
            <h3>Thông tin về thời tiết</h3>
            <p>Tìm hiểu về các loại thời tiết và cách phòng tránh</p>
            <a href="/weather-info.html" target="_blank" rel="noopener noreferrer">
              Xem hướng dẫn chi tiết
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard