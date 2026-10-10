import { useRef } from 'react'
import { getWeatherDescription } from '../../utils/weatherUtils.js'

const formatTime = (timeString, timezone) => {
  const date = new Date(timeString)
  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone || 'Asia/Bangkok',
  }).format(date)
}

const formatDate = (dateString, timezone) => {
  const date = new Date(`${dateString}T12:00:00`)
  if (Number.isNaN(date.getTime())) return dateString

  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: timezone || 'Asia/Bangkok',
  }).format(date)
}

function WeatherForecast({ weather }) {
  const dailyDragRef = useRef(null)

  const handleDailyPointerDown = (event) => {
    if (!event.isPrimary || event.pointerType !== 'mouse' || event.button !== 0) return

    dailyDragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: event.currentTarget.scrollLeft,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  const handleDailyPointerMove = (event) => {
    if (dailyDragRef.current?.pointerId !== event.pointerId) return

    event.currentTarget.scrollLeft = dailyDragRef.current.startScrollLeft
      - (event.clientX - dailyDragRef.current.startX)
  }

  const handleDailyPointerEnd = (event) => {
    if (dailyDragRef.current?.pointerId !== event.pointerId) return

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    dailyDragRef.current = null
  }

  const hourly = weather?.hourly?.time
    ? weather.hourly.time.slice(0, 24).map((time, index) => ({
        time,
        temperature: weather.hourly.temperature_2m?.[index] ?? weather.temperature,
        windSpeed: weather.hourly.wind_speed_10m?.[index] ?? weather.windSpeed ?? 0,
        precipitation: weather.hourly.precipitation?.[index] ?? 0,
      }))
    : []
  const daily = (weather?.daily?.time || []).map((date, index) => ({
    date,
    weatherCode: weather.daily.weather_code?.[index],
    precipitation: weather.daily.precipitation_sum?.[index],
    uvIndex: weather.daily.uv_index_max?.[index],
    sunrise: weather.daily.sunrise?.[index],
    sunset: weather.daily.sunset?.[index],
  }))

  return (
    <div className="weather-forecast-tab">
      <section className="forecast-section" aria-labelledby="hourly-forecast-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">DỰ BÁO NGẮN HẠN</p>
            <h2 id="hourly-forecast-title">24 giờ tiếp theo</h2>
          </div>
          {hourly.length > 0 && <span className="forecast-count">{hourly.length} mốc</span>}
        </div>
        {hourly.length > 0 ? (
          <div className="forecast-scroll">
            {hourly.map((item) => (
              <article className="forecast-item" key={item.time}>
                <div className="forecast-time">{formatTime(item.time, weather.timezone)}</div>
                <div className="forecast-temp">{Math.round(item.temperature)}°C</div>
                <div className="forecast-wind">💨 {item.windSpeed.toFixed(1)} m/s</div>
                <div className="forecast-rain">🌧️ {item.precipitation.toFixed(1)} mm</div>
              </article>
            ))}
          </div>
        ) : (
          <p className="forecast-empty">Dữ liệu dự báo theo giờ chưa có.</p>
        )}
      </section>

      <section className="daily-forecast-section" aria-labelledby="daily-forecast-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">DỰ BÁO NHIỀU NGÀY</p>
            <h2 id="daily-forecast-title">Tổng quan từng ngày</h2>
          </div>
        </div>
        {daily.length > 0 ? (
          <>
            <p className="daily-forecast-hint">Vuốt hoặc kéo ngang để xem dự báo các ngày tiếp theo</p>
            <div
              className="daily-forecast"
              role="region"
              aria-label="Dự báo thời tiết nhiều ngày"
              tabIndex={0}
              onPointerDown={handleDailyPointerDown}
              onPointerMove={handleDailyPointerMove}
              onPointerUp={handleDailyPointerEnd}
              onPointerCancel={handleDailyPointerEnd}
            >
              {daily.map((day) => (
                <article className="daily-item" key={day.date}>
                  <h3 className="daily-date">{formatDate(day.date, weather.timezone)}</h3>
                  <p className="daily-condition">
                    {day.weatherCode == null ? 'Dự báo' : getWeatherDescription(day.weatherCode)}
                  </p>
                  <div className="daily-details">
                    <div className="detail-row">
                      <span>Lượng mưa</span>
                      <strong>{day.precipitation == null ? '—' : `${day.precipitation} mm`}</strong>
                    </div>
                    <div className="detail-row">
                      <span>UV tối đa</span>
                      <strong>{day.uvIndex == null ? '—' : day.uvIndex}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Mặt trời mọc</span>
                      <strong>{day.sunrise ? formatTime(day.sunrise, weather.timezone) : '—'}</strong>
                    </div>
                    <div className="detail-row">
                      <span>Mặt trời lặn</span>
                      <strong>{day.sunset ? formatTime(day.sunset, weather.timezone) : '—'}</strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        ) : (
          <p className="forecast-empty">Dữ liệu dự báo theo ngày chưa có.</p>
        )}
      </section>
    </div>
  )
}

export default WeatherForecast
