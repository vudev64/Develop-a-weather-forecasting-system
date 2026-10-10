const formatCoordinate = (value, direction) => {
  if (value == null) return '—'
  return `${Math.abs(value).toFixed(3)}° ${value < 0 ? direction[1] : direction[0]}`
}

const formatDateTime = (value, timezone) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: timezone || 'Asia/Bangkok',
  }).format(date)
}

function DetailsTab({ weather, onOpenSafetyGuide }) {
  if (!weather) {
    return (
      <div className="weather-details-tab">
        <section className="dashboard-state empty-state">
          <span className="empty-state-icon" aria-hidden="true">☁</span>
          <h2>Chưa có địa điểm được chọn</h2>
          <p>Tìm thành phố để xem các chỉ số thời tiết chi tiết.</p>
        </section>
        <SafetyGuideCard onOpen={onOpenSafetyGuide} />
      </div>
    )
  }

  const details = [
    { label: 'Cảm giác như', value: `${weather.feelsLike}°C`, icon: '≈' },
    { label: 'Độ ẩm tương đối', value: `${weather.humidity}%`, icon: '◌' },
    { label: 'Tốc độ gió', value: `${weather.windSpeed.toFixed(1)} m/s`, icon: '↗' },
    { label: 'Hướng gió', value: `${weather.windDirection}°`, icon: '⌖' },
    { label: 'Gió giật', value: `${weather.windGust.toFixed(1)} m/s`, icon: '≋' },
    { label: 'Lượng mưa hiện tại', value: `${weather.precipitation} mm`, icon: '⌁' },
    { label: 'Mã trạng thái thời tiết', value: weather.weatherCode, icon: '☼' },
    { label: 'Múi giờ địa điểm', value: weather.timezone || '—', icon: '◷' },
  ]

  return (
    <div className="weather-details-tab">
      <section className="details-location-card">
        <div>
          <p className="eyebrow">ĐỊA ĐIỂM ĐANG XEM</p>
          <h2>{weather.city}{weather.country && <span>, {weather.country}</span>}</h2>
          <p>{weather.description}</p>
        </div>
        <div className="location-coordinates">
          <span>{formatCoordinate(weather.latitude, ['N', 'S'])}</span>
          <span>{formatCoordinate(weather.longitude, ['E', 'W'])}</span>
        </div>
      </section>

      <section className="details-grid" aria-label="Các chỉ số thời tiết chi tiết">
        {details.map((detail) => (
          <article className="details-metric" key={detail.label}>
            <span className="details-metric-icon" aria-hidden="true">{detail.icon}</span>
            <span className="details-metric-label">{detail.label}</span>
            <strong>{detail.value}</strong>
          </article>
        ))}
      </section>

      <section className="details-time-card">
        <div>
          <p className="eyebrow">THỜI ĐIỂM DỮ LIỆU</p>
          <h2>Thời gian quan trắc</h2>
          <p>Giờ địa phương theo múi giờ của địa điểm được chọn.</p>
        </div>
        <strong>{formatDateTime(weather.current?.time, weather.timezone)}</strong>
      </section>

      <SafetyGuideCard onOpen={onOpenSafetyGuide} />
    </div>
  )
}

function SafetyGuideCard({ onOpen }) {
  return (
    <section className="details-info-card" id="weather-guide">
      <div className="info-box-icon" aria-hidden="true">☼</div>
      <div>
        <h2>Các loại thời tiết &amp; cách phòng tránh</h2>
        <p>Xem hướng dẫn an toàn khi gặp các hiện tượng thời tiết nguy hiểm.</p>
      </div>
      <button type="button" onClick={onOpen}>
        Xem hướng dẫn <span aria-hidden="true">→</span>
      </button>
    </section>
  )
}

export default DetailsTab
