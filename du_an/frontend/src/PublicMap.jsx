import { useState, useEffect } from 'react'
import Map from './Map'

/**
 * PublicMap - Bản đồ thời tiết cho trang public
 * Hiển thị bản đồ mặc định + cho phép search thành phố
 */
function PublicMap() {
  const [city, setCity] = useState('Hanoi')
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const API_URL = 'http://localhost:5000/api'

  // Hàm chuyển đổi WMO weather code sang mô tả
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

  // Fetch weather data
  const fetchWeather = async (cityName) => {
    setLoading(true)
    setError('')
    setWeather(null)

    try {
      const response = await fetch(`${API_URL}/weather/${cityName}`)
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

      console.log('✅ Weather data loaded:', weatherData)
      setWeather(weatherData)
    } catch (err) {
      console.error('❌ Lỗi fetch weather:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Load default weather on mount
  useEffect(() => {
    fetchWeather('Hanoi')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (city.trim()) {
      fetchWeather(city)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e)
    }
  }

  return (
    <div className="public-map-wrapper">
      {/* Search Box */}
      <div className="public-search-bar">
        <form onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Nhập tên thành phố..."
            value={city}
            onChange={(e) => setCity(e.target.value)}
            onKeyPress={handleKeyPress}
            className="public-search-input"
          />
          <button type="submit" disabled={loading} className="public-search-btn">
            {loading ? '⏳ Đang tìm...' : '🔍 Tìm'}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && <div className="public-error-message">{error}</div>}

      {/* Weather Data or Loading */}
      {loading && !weather && (
        <div className="loading-container">
          <p>Đang tải dữ liệu thời tiết...</p>
        </div>
      )}

      {/* Map Component */}
      {weather && <Map weather={weather} />}
    </div>
  )
}

export default PublicMap
