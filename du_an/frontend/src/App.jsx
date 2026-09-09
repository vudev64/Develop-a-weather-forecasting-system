import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import './App.css'
import PublicHome from './PublicHome'
import Dashboard from './Dashboard'
import LoginModal from './LoginModal'
import ProtectedRoute from './components/ProtectedRoute'
import { authService } from './services/authService.js'

const AuthContext = createContext(null)

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)
  const [sessionNotice, setSessionNotice] = useState('')
  const clearSessionNotice = useCallback(() => setSessionNotice(''), [])

  const clearSession = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    localStorage.removeItem('phone')
    setToken(null)
    setUser(null)
  }, [])

  const refreshSession = useCallback(async () => {
    const currentToken = localStorage.getItem('token')
    setToken(currentToken)

    if (!currentToken) {
      setUser(null)
      clearSessionNotice()
      setLoading(false)
      return null
    }

    setLoading(true)

    try {
      const response = await authService.getMe()
      const currentUser = response?.data ?? null
      setUser(currentUser)
      clearSessionNotice()
      return currentUser
    } catch (error) {
      // Đọc status code từ response của Axios/Fetch
      const status = error?.response?.status || error?.status
      const errorText = String(error?.response?.data?.message || error?.message || '')
      const isNetworkError = error?.code === 'ERR_NETWORK' || !error?.response

      // TH1: Xử lý khi Token thực sự HẾT HẠN hoặc KHÔNG HỢP LỆ (401 / 403)
      if (status === 401 || status === 403 || /hết hạn|invalid|không hợp lệ|unauthorized/i.test(errorText)) {
        setSessionNotice('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại.')
        clearSession() // Chỉ xóa token khi thực sự mất quyền truy cập
      } 
      // TH2: Xử lý khi MẤT MẠNG hoặc MÁY CHỦ BỊ LỖI (5xx)
      else if (isNetworkError || status >= 500) {
        setSessionNotice('Không thể kết nối đến máy chủ. Đang dùng phiên offline...')
        // KHÔNG gọi clearSession() ở đây -> Giữ nguyên token trong localStorage
      } 
      // TH3: Các lỗi khác
      else {
        setSessionNotice('Có lỗi xảy ra khi xác thực tài khoản.')
      }

      return null
    } finally {
      setLoading(false)
    }
  }, [clearSession, clearSessionNotice])

  useEffect(() => {
    void refreshSession()
  }, [refreshSession])

  const value = useMemo(() => ({
    user,
    token,
    loading,
    sessionNotice,
    isAuthenticated: Boolean(token),
    refreshSession,
    clearSession,
    clearSessionNotice,
  }), [user, token, loading, sessionNotice, refreshSession, clearSession, clearSessionNotice])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}

function AppRoutes() {
  const { user, loading, sessionNotice, clearSessionNotice, refreshSession, clearSession, isAuthenticated } = useAuth()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.state?.openLoginModal) {
      setIsLoginModalOpen(true)
      navigate(location.pathname, { replace: true })
    }
  }, [location.pathname, location.state, navigate])

  const handleOpenLoginModal = () => {
    clearSessionNotice()
    setIsLoginModalOpen(true)
  }

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false)
  }

  const handleLogin = async () => {
    setIsLoginModalOpen(false)
    clearSessionNotice()
    const currentUser = await refreshSession()

    if (currentUser) {
      navigate('/dashboard', { replace: true })
    }
  }

  const handleLogout = async () => {
    try {
      await authService.logout()
    } finally {
      clearSession()
      clearSessionNotice()
      navigate('/', { replace: true })
    }
  }

  if (loading) {
    return (
      <div className="app-loading" style={{ padding: '3rem', textAlign: 'center' }}>
        Đang khôi phục phiên đăng nhập...
      </div>
    )
  }

  return (
    <>
      {sessionNotice ? (
        <div style={{
          background: '#fff4cc',
          color: '#6b4e00',
          borderBottom: '1px solid #f2d16b',
          padding: '0.85rem 1rem',
          textAlign: 'center',
          fontWeight: 600,
        }}>
          {sessionNotice}
        </div>
      ) : null}

      <Routes>
        <Route
          path="/"
          element={isAuthenticated ? <Navigate to="/dashboard" replace /> : (
            <PublicHome
              onGoToLogin={handleOpenLoginModal}
              isAuthenticated={isAuthenticated}
            />
          )}
        />
        <Route
          path="/dashboard"
          element={(
            <ProtectedRoute isAuthenticated={isAuthenticated} loading={loading}>
              <Dashboard username={user?.fullName || user?.username || user?.phone || 'Người dùng'} onLogout={handleLogout} />
            </ProtectedRoute>
          )}
        />
        <Route path="/login" element={<Navigate to="/" replace state={{ openLoginModal: true }} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleCloseLoginModal}
        onLogin={handleLogin}
      />
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default App