import { useState } from 'react'
import './LoginModal.css'
import { GoogleLogin } from '@react-oauth/google'

function LoginModal({ isOpen, onClose, onLogin }) {
  const [isLogin, setIsLogin] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const endpoint = isLogin ? '/api/users/login' : '/api/users/register'
      
      if (!isLogin && password !== confirmPassword) {
        setError('Mật khẩu không khớp!')
        setLoading(false)
        return
      }

      console.log(`📝 Đang ${isLogin ? 'đăng nhập' : 'đăng ký'}...`)

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })

      const data = await response.json()
      console.log('✅ Response:', data)

      if (!response.ok) {
        setError(data.message || `Lỗi ${response.status}: ${response.statusText}`)
        console.error('❌ Error:', data)
        setLoading(false)
        return
      }

      localStorage.setItem('token', data.token)
      localStorage.setItem('username', data.data?.username || username)
      console.log('✅ Đăng nhập thành công')
      onLogin(data.data?.username || username)
      onClose()
    } catch (err) {
      console.error('❌ Network Error:', err)
      setError(`Lỗi kết nối: ${err.message}\n\nĐảm bảo Backend chạy trên http://localhost:5000`)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    setError('')
    try {
      console.log('🔐 Google Response:', credentialResponse)
      
      const response = await fetch('http://localhost:5000/api/auth/google/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      })
      
      const data = await response.json()
      console.log('✅ Auth Response:', data)
      
      if (data.success && data.token) {
        localStorage.setItem('token', data.token)
        console.log('✅ Google Login thành công!')
        onLogin(data.user.username)
        onClose()
      } else {
        setError(data.error || 'Đăng nhập Google thất bại')
      }
    } catch (err) {
      console.error('❌ Google Login Error:', err)
      setError(`Lỗi Google login: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleError = () => {
    setError('Đăng nhập Google thất bại. Vui lòng thử lại.')
  }

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose}>✕</button>

        <h2>{isLogin ? 'Đăng Nhập' : 'Đăng Ký'}</h2>

        {error && <div className="modal-error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="modal-form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="modal-form-group">
            <label>Password</label>
            <div className="modal-password-group">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <button
                type="button"
                className="modal-toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="modal-form-group">
              <label>Confirm Password</label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>
          )}

          <button
            type="submit"
            className="modal-login-button"
            disabled={loading}
          >
            {loading ? 'Đang xử lý...' : (isLogin ? 'Đăng Nhập' : 'Đăng Ký')}
          </button>
        </form>

        {isLogin && (
          <div className="modal-forgot-password">
            <a href="#forgot">Quên mật khẩu?</a>
          </div>
        )}

        <div className="modal-switch-mode">
          <p>
            {isLogin ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
            <span onClick={() => {
              setIsLogin(!isLogin)
              setError('')
            }}>
              {isLogin ? 'Đăng Ký Ngay' : 'Đăng Nhập'}
            </span>
          </p>
        </div>

        <div className="modal-divider">
          <span>hoặc</span>
        </div>

        <div className="modal-oauth-buttons">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            text="signin_with"
            width="100%"
          />
        </div>
      </div>
    </div>
  )
}

export default LoginModal
