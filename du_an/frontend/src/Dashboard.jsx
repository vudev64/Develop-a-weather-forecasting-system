import { useEffect, useState } from 'react'
import './Dashboard.css'
import Map from './Map.jsx'
import UserAvatarMenu from './UserAvatarMenu.jsx'
import OverviewTab from './components/dashboard/OverviewTab.jsx'
import ForecastTab from './components/dashboard/ForecastTab.jsx'
import MapTab from './components/dashboard/MapTab.jsx'
import DetailsTab from './components/dashboard/DetailsTab.jsx'
import WeatherSafetyGuide from './components/dashboard/WeatherSafetyGuide.jsx'
import { authService } from './services/authService.js'
import { mapWeatherResponse as normalizeWeatherResponse, weatherService } from './services/weatherService.js'
import { getWeatherDescription } from './utils/weatherUtils.js'

const DASHBOARD_TABS = [
  { id: 'overview', label: 'Tổng quan', icon: '◉', description: 'Thời tiết hiện tại tại địa điểm đang xem.' },
  { id: 'forecast', label: 'Dự báo', icon: '◷', description: 'Dự báo theo giờ và tổng quan từng ngày.' },
  { id: 'map', label: 'Bản đồ', icon: '⌖', description: 'Bản đồ địa điểm và các lớp thời tiết.' },
  { id: 'details', label: 'Thông tin chi tiết', icon: '☼', description: 'Các chỉ số và thông tin vị trí hiện tại.' },
]

function Dashboard({ username, onLogout }) {
  const [activeTab, setActiveTab] = useState('overview')
  const [isSafetyGuideOpen, setIsSafetyGuideOpen] = useState(false)
  const [city, setCity] = useState('')
  const [weather, setWeather] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userInfo, setUserInfo] = useState(null)
  const [layerConfig, setLayerConfig] = useState({
    temperature: false,
    wind: false,
    rainfall: false,
    humidity: false,
    opacity: 0.7
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
    setIsSafetyGuideOpen(false)

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

  const handleSubmit = (event) => {
    event.preventDefault()
    void searchWeather()
  }

  const handleSelectCityFromMenu = (selectedCity) => {
    setCity(selectedCity)
    void searchWeather(selectedCity)
  }

  const handleTabKeyDown = (event) => {
    const currentIndex = DASHBOARD_TABS.findIndex((tab) => tab.id === activeTab)
    let nextIndex = currentIndex

    if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
      nextIndex = (currentIndex + 1) % DASHBOARD_TABS.length
    } else if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
      nextIndex = (currentIndex - 1 + DASHBOARD_TABS.length) % DASHBOARD_TABS.length
    } else {
      return
    }

    event.preventDefault()
    const nextTab = DASHBOARD_TABS[nextIndex]
    setActiveTab(nextTab.id)
    setIsSafetyGuideOpen(false)
    event.currentTarget.querySelector(`[data-tab="${nextTab.id}"]`)?.focus()
  }

  const selectedTab = DASHBOARD_TABS.find((tab) => tab.id === activeTab) || DASHBOARD_TABS[0]
  const pageTitle = isSafetyGuideOpen ? 'Hướng dẫn an toàn thời tiết' : selectedTab.label
  const pageDescription = isSafetyGuideOpen
    ? 'Tìm hiểu ảnh hưởng và cách phòng tránh các hiện tượng thời tiết.'
    : selectedTab.description

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <a className="dashboard-brand" href="#overview" aria-label="WeatherWeb dashboard">
          <span className="brand-mark" aria-hidden="true">W</span>
          <span>
            <strong>WeatherWeb</strong>
            <small>Personal weather</small>
          </span>
        </a>

        <form className="dashboard-search" onSubmit={handleSubmit} role="search">
          <span className="search-icon" aria-hidden="true">⌕</span>
          <input
            type="search"
            aria-label="Tìm thành phố hoặc địa điểm"
            placeholder="Tìm thành phố hoặc địa điểm..."
            value={city}
            onChange={(event) => setCity(event.target.value)}
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Đang tìm...' : 'Tìm kiếm'}
          </button>
        </form>

        <div className="dashboard-account" id="saved-places">
          <span className="account-label">Tài khoản</span>
          <UserAvatarMenu
            username={username}
            userInfo={userInfo}
            onLogout={onLogout}
            onSelectCity={handleSelectCityFromMenu}
          />
        </div>
      </header>

      <div className="dashboard-shell">
        <aside className="dashboard-sidebar" aria-label="Điều hướng dashboard">
          <div className="sidebar-section" role="tablist" aria-label="WeatherWeb">
            <p className="sidebar-label">Không gian</p>
            {DASHBOARD_TABS.map((tab) => (
              <button
                className={`sidebar-link ${activeTab === tab.id ? 'active' : ''}`}
                id={`tab-${tab.id}`}
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                aria-controls="dashboard-tab-panel"
                data-tab={tab.id}
                tabIndex={activeTab === tab.id ? 0 : -1}
                onClick={() => {
                  setActiveTab(tab.id)
                  setIsSafetyGuideOpen(false)
                }}
                onKeyDown={handleTabKeyDown}
              >
                <span aria-hidden="true">{tab.icon}</span>{tab.label}
              </button>
            ))}
          </div>

          <div className="sidebar-footer">Dữ liệu thời tiết từ Open-Meteo</div>
        </aside>

        <main className="dashboard-main">
          <div className="dashboard-page-heading">
            <div>
              <p className="eyebrow">WEATHERWEB / {pageTitle.toLocaleUpperCase('vi')}</p>
              <h1>{pageTitle}</h1>
              <p className="page-subtitle">{pageDescription}</p>
            </div>
          </div>

          {error && (
            <div className="dashboard-state error-state" role="alert">
              <span aria-hidden="true">!</span>
              <div>
                <strong>Không thể tải thông tin thời tiết</strong>
                <p>{error}</p>
              </div>
            </div>
          )}

          {loading && (
            <div className="dashboard-state loading-state" role="status" aria-live="polite">
              <span className="loading-spinner" aria-hidden="true" />
              <div>
                <strong>Đang cập nhật thời tiết</strong>
                <p>Đang tìm dữ liệu cho địa điểm bạn chọn...</p>
              </div>
            </div>
          )}

          {!weather && !loading && !error && activeTab !== 'details' && (
            <section className="dashboard-state empty-state">
              <span className="empty-state-icon" aria-hidden="true">☁</span>
              <h2>Chưa có địa điểm được chọn</h2>
              <p>Tìm thành phố phía trên để xem {selectedTab.label.toLocaleLowerCase('vi')}.</p>
            </section>
          )}

          {(weather || activeTab === 'details') && (
            <div
              className="dashboard-tab-content"
              id="dashboard-tab-panel"
              role="tabpanel"
              aria-labelledby={`tab-${activeTab}`}
              tabIndex={0}
            >
              {activeTab === 'overview' && <OverviewTab weather={weather} />}
              {activeTab === 'forecast' && <ForecastTab weather={weather} />}
              {activeTab === 'map' && (
                <MapTab
                  weather={weather}
                  layerConfig={layerConfig}
                  onLayerChange={setLayerConfig}
                />
              )}
              {activeTab === 'details' && (
                isSafetyGuideOpen ? (
                  <WeatherSafetyGuide onBack={() => setIsSafetyGuideOpen(false)} />
                ) : (
                  <DetailsTab
                    weather={weather}
                    onOpenSafetyGuide={() => setIsSafetyGuideOpen(true)}
                  />
                )
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Dashboard
