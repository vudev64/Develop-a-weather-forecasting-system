import { useState } from 'react'
import './Dashboard.css'
import Map from './Map'

function Dashboard({ username, onLogout }) {
  const [city, setCity] = useState('')
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const API_URL = 'http://localhost:5000/api'

  // Hàm chuyển đổi WMO weather code sang mô tả (Open-Meteo)
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
    };
    return codes[code] || 'Không xác định';
  }

  const searchWeather = async () => {
    if (!city.trim()) {
      setError('Vui lòng nhập tên thành phố')
      return
    }

    setLoading(true)
    setError('')
    setWeather(null)

    try {
      const response = await fetch(`${API_URL}/weather/${city}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Không thể lấy dữ liệu thời tiết')
      }

      // Transform dữ liệu: flatten current data vào top level
      const weatherData = {
        ...data.data,
        // Flatten current object
        temperature: Math.round(data.data.current.temperature),
        feelsLike: Math.round(data.data.current.feelsLike),
        humidity: data.data.current.humidity,
        windSpeed: data.data.current.windSpeed,
        windDirection: data.data.current.windDirection,
        windGust: data.data.current.windGust,
        precipitation: data.data.current.precipitation,
        weatherCode: data.data.current.weatherCode,
      }

      // Thêm mô tả thời tiết
      weatherData.description = getWeatherDescription(weatherData.weatherCode)

      setWeather(weatherData)

      // Lưu lịch sử tìm kiếm
      await fetch(`${API_URL}/users/search-history`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, city: data.data.city })
      })

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchWeather()
    }
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="user-info">
          <span>Xin chào, <strong>{username}</strong></span>
        </div>
        <button onClick={onLogout} className="logout-button">
          Đăng xuất
        </button>
      </div>

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
            <button onClick={searchWeather} disabled={loading}>
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
                <h3>{weather.city}, {weather.country}</h3>
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
                <Map weather={weather} />
              </div>
            )}
          </div>

          <div className="info-box">
            <h3>Thông tin về thời tiết</h3>
            <p>Tìm hiểu về các loại thời tiết và cách phòng tránh</p>
            <a href="/weather-info.html" target="_blank">
              Xem hướng dẫn chi tiết
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
