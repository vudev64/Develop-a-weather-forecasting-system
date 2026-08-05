import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './UserAvatarMenu.css' 
import { weatherService } from './services/weatherService.js'

const HISTORY_STORAGE_KEY = 'weather-search-history'
const FAVORITES_STORAGE_KEY = 'weather-favorites'

function UserAvatarMenu({ username, userInfo, onLogout, onSelectCity }) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [history, setHistory] = useState([])
  const [favorites, setFavorites] = useState([])
  const [loadingFavorites, setLoadingFavorites] = useState(false)
  const [menuError, setMenuError] = useState('')
  const menuRef = useRef(null)

  const displayName = userInfo?.username || userInfo?.phone || username || 'Khách'
  const displayPhone = userInfo?.phone || ''
  const displayEmail = userInfo?.email || ''
  const avatarLetter = displayName ? displayName.charAt(0).toUpperCase() : '?'

  const normalizedHistory = useMemo(() => {
    if (Array.isArray(userInfo?.searchHistory) && userInfo.searchHistory.length > 0) {
      return userInfo.searchHistory
        .map((item) => ({
          city: item.city,
          searchedAt: item.searchedAt || item.createdAt || new Date().toISOString(),
        }))
        .reverse()
    }
    return history
  }, [history, userInfo?.searchHistory])

  const loadLocalFavorites = () => {
    try {
      return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY) || '[]')
    } catch {
      return []
    }
  }

  const persistFavorites = (nextFavorites) => {
    setFavorites(nextFavorites)
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(nextFavorites))
  }

  const loadMenuData = useCallback(async () => {
    try {
      const storedHistory = JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]')
      setHistory(storedHistory)

      setLoadingFavorites(true)
      setMenuError('')

      try {
        const response = await weatherService.getFavorites()
        const apiFavorites = Array.isArray(response?.data) ? response.data : response?.data?.items || []

        if (apiFavorites.length > 0) {
          persistFavorites(apiFavorites)
        } else {
          persistFavorites(loadLocalFavorites())
        }
      } catch {
        persistFavorites(loadLocalFavorites())
      }
    } catch (error) {
      setMenuError(error.message || 'Không thể tải dữ liệu menu')
    } finally {
      setLoadingFavorites(false)
    }
  }, [])

  const addFavorite = async (city) => {
    const normalizedCity = (city || '').trim()
    if (!normalizedCity) return

    const nextFavorites = [
      { city: normalizedCity, addedAt: new Date().toISOString() },
      ...favorites.filter((item) => item.city?.toLowerCase() !== normalizedCity.toLowerCase()),
    ].slice(0, 20)

    persistFavorites(nextFavorites)

    try {
      await weatherService.addFavorite(normalizedCity)
    } catch {
      // Fallback local storage
    }
  }

  const removeFavorite = async (city) => {
    const normalizedCity = (city || '').trim()
    const nextFavorites = favorites.filter((item) => item.city?.toLowerCase() !== normalizedCity.toLowerCase())
    persistFavorites(nextFavorites)

    try {
      await weatherService.removeFavorite(normalizedCity)
    } catch {
      // Fallback local storage
    }
  }

  const isFavorite = (city) => {
    return favorites.some((item) => item.city?.toLowerCase() === city?.toLowerCase())
  }

  const handleCityClick = (city) => {
    if (onSelectCity) {
      onSelectCity(city)
    }
    setIsOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (isOpen) {
      void loadMenuData()
    }
  }, [isOpen, loadMenuData])

  return (
    <div className="user-avatar-menu" ref={menuRef}>
      {/* Nút Avatar duy nhất đóng vai trò Trigger Menu */}
      <button 
        type="button" 
        className="avatar-btn" 
        onClick={() => setIsOpen(!isOpen)}
        title="Tài khoản & Menu"
      >
        <span className="avatar-circle">{avatarLetter}</span>
      </button>

      {isOpen && (
        <div className="avatar-dropdown">
          <div className="avatar-dropdown-header">
            <span className="avatar-circle avatar-circle-large">{avatarLetter}</span>
            <div>
              <div className="dropdown-username">{displayName}</div>
              {displayEmail && <div className="dropdown-email">{displayEmail}</div>}
            </div>
          </div>

          <div className="avatar-dropdown-tabs">
            <button type="button" className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Hồ sơ</button>
            <button type="button" className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>Lịch sử</button>
            <button type="button" className={`tab-btn ${activeTab === 'favorites' ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>Yêu thích</button>
          </div>

          <div className="avatar-dropdown-content">
            {menuError && <div className="history-status error">{menuError}</div>}

            {activeTab === 'profile' && (
              <div className="info-tab">
                {displayPhone && (
                  <div className="info-row">
                    <span className="info-label">Số điện thoại:</span>
                    <span className="info-value">{displayPhone}</span>
                  </div>
                )}
                {displayEmail && (
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value">{displayEmail}</span>
                  </div>
                )}
                {userInfo?.createdAt && (
                  <div className="info-row">
                    <span className="info-label">Tham gia:</span>
                    <span className="info-value">
                      {new Date(userInfo.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'history' && (
              <div>
                {normalizedHistory.length === 0 ? (
                  <div className="history-status">Chưa có lịch sử tìm kiếm.</div>
                ) : (
                  <ul className="history-list">
                    {normalizedHistory.map((item, index) => (
                      <li key={`${item.city}-${index}`} className="history-item">
                        <div onClick={() => handleCityClick(item.city)} style={{ cursor: 'pointer', flex: 1 }}>
                          <div className="history-city">{item.city}</div>
                          <div className="history-date">
                            {item.searchedAt ? new Date(item.searchedAt).toLocaleString('vi-VN') : ''}
                          </div>
                        </div>
                        <button type="button" className="history-action-btn" onClick={() => addFavorite(item.city)}>
                          {isFavorite(item.city) ? '★' : '☆'}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {activeTab === 'favorites' && (
              <div>
                {loadingFavorites ? (
                  <div className="history-status">Đang tải favorites...</div>
                ) : favorites.length === 0 ? (
                  <div className="history-status">Chưa có thành phố yêu thích.</div>
                ) : (
                  <ul className="history-list">
                    {favorites.map((item, index) => (
                      <li key={`${item.city}-${index}`} className="history-item">
                        <div onClick={() => handleCityClick(item.city)} style={{ cursor: 'pointer', flex: 1 }}>
                          <div className="history-city">{item.city}</div>
                          <div className="history-date">
                            {item.addedAt ? new Date(item.addedAt).toLocaleDateString('vi-VN') : 'Đã lưu'}
                          </div>
                        </div>
                        <button type="button" className="history-action-btn danger" onClick={() => removeFavorite(item.city)}>
                          Xóa
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          <button 
            type="button"
            className="dropdown-logout-btn" 
            onClick={() => { 
              setIsOpen(false)
              onLogout() 
            }}
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  )
}

export default UserAvatarMenu