const formatUpdateTime = (time, timezone) => {
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return time

  return new Intl.DateTimeFormat('vi-VN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone || 'Asia/Bangkok',
  }).format(date)
}

function OverviewTab({ weather }) {
  if (!weather) return null

  return (
    <section className="current-weather-card" aria-labelledby="current-weather-title">
      <div className="current-weather-main">
        <div>
          <p className="eyebrow light-eyebrow">THỜI TIẾT HIỆN TẠI</p>
          <h2 id="current-weather-title">
            {weather.city}{weather.country && <span>, {weather.country}</span>}
          </h2>
          <p className="current-description">{weather.description}</p>
        </div>
        <div className="current-temperature">
          <span className="temperature-value">{weather.temperature}</span>
          <span className="temperature-unit">°C</span>
        </div>
      </div>
      <div className="current-weather-meta">
        <span>Cảm giác như <strong>{weather.feelsLike}°C</strong></span>
        {weather.current?.time && (
          <span>Cập nhật lúc {formatUpdateTime(weather.current.time, weather.timezone)}</span>
        )}
      </div>
      <div className="weather-metrics">
        <div className="metric-card">
          <span className="metric-icon humidity-icon" aria-hidden="true">◌</span>
          <span className="metric-label">Độ ẩm</span>
          <strong>{weather.humidity}%</strong>
        </div>
        <div className="metric-card">
          <span className="metric-icon wind-icon" aria-hidden="true">↗</span>
          <span className="metric-label">Tốc độ gió</span>
          <strong>{weather.windSpeed.toFixed(1)} <small>m/s</small></strong>
        </div>
        <div className="metric-card">
          <span className="metric-icon gust-icon" aria-hidden="true">≋</span>
          <span className="metric-label">Gió giật</span>
          <strong>{weather.windGust.toFixed(1)} <small>m/s</small></strong>
        </div>
        <div className="metric-card">
          <span className="metric-icon rain-icon" aria-hidden="true">⌁</span>
          <span className="metric-label">Lượng mưa</span>
          <strong>{weather.precipitation} <small>mm</small></strong>
        </div>
      </div>
    </section>
  )
}

export default OverviewTab
