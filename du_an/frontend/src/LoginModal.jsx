import { useState } from 'react'
import './LoginModal.css'
import { GoogleLogin } from '@react-oauth/google'

function LoginModal({ isOpen, onClose, onLogin }) {
  const [mode, setMode] = useState('login') // 'login', 'register', 'forgot'
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  // Kiểm tra độ mạnh mật khẩu
  const checkPasswordStrength = (pwd) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[a-z]/.test(pwd)) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^a-zA-Z0-9]/.test(pwd)) strength++
    return strength
  }

  // Lấy mức độ mạnh và màu sắc
  const getPasswordStrengthInfo = (pwd) => {
    const strength = checkPasswordStrength(pwd)
    if (strength === 0) return { label: '', color: '' }
    if (strength <= 2) return { label: 'Yếu', color: '#ef4444' }
    if (strength <= 3) return { label: 'Trung bình', color: '#f59e0b' }
    return { label: 'Mạnh', color: '#22c55e' }
  }

  const isPasswordStrongEnough = (pwd) => {
    return checkPasswordStrength(pwd) >= 4
  }

  if (!isOpen) return null

  const resetForm = () => {
    setError('')
    setSuccessMessage('')
    setPhone('')
    setUsername('')
    setPassword('')
    setNewPassword('')
    setConfirmPassword('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      if (mode === 'register' && password !== confirmPassword) {
        setError('Mật khẩu không khớp!')
        setLoading(false)
        return
      }

      if (mode === 'register' && !isPasswordStrongEnough(password)) {
        setError('Mật khẩu phải đủ mạnh: ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt!')
        setLoading(false)
        return
      }

      if (mode === 'forgot' && newPassword !== confirmPassword) {
        setError('Mật khẩu mới không khớp!')
        setLoading(false)
        return
      }

      if (mode === 'forgot' && !isPasswordStrongEnough(newPassword)) {
        setError('Mật khẩu phải đủ mạnh: ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt!')
        setLoading(false)
        return
      }

      let endpoint = ''
      let body = {}

      if (mode === 'login') {
        endpoint = '/api/users/login'
        body = { phone, password }
      } else if (mode === 'register') {
        endpoint = '/api/users/register'
        body = { phone, username, password }
      } else if (mode === 'forgot') {
        endpoint = '/api/users/reset-password'
        body = { phone, newPassword }
      }

      console.log(`📝 Đang xử lý...`)

      const response = await fetch(`http://localhost:5000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()
      console.log('✅ Response:', data)

      if (!response.ok) {
        setError(data.error || data.message || `Lỗi ${response.status}: ${response.statusText}`)
        console.error('❌ Error:', data)
        setLoading(false)
        return
      }

      // REGISTER: chỉ show success, quay lại login
      if (mode === 'register') {
        alert('✅ Đăng ký thành công! Vui lòng đăng nhập.')
        resetForm()
        setMode('login')
        return
      }

      // FORGOT: show success, quay lại login
      if (mode === 'forgot') {
        setSuccessMessage('✅ Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.')
        resetForm()
        setMode('login')
        return
      }

      // LOGIN: lưu token và jump vào dashboard
      localStorage.setItem('token', data.token || '')
      localStorage.setItem('username', data.data?.phone || phone)
      console.log('✅ Đăng nhập thành công')
      onLogin(data.data?.phone || phone)
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
      console.log('🔐 Google Credential nhận được, length:', credentialResponse.credential.length)
      
      const response = await fetch('http://localhost:5000/api/auth/google/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: credentialResponse.credential })
      })
      
      const data = await response.json()
      console.log('✅ Backend Response:', data)
      console.log('   Status:', response.status)
      console.log('   Response OK:', response.ok)
      
      if (!response.ok) {
        console.error('❌ Backend error:')
        console.error('   Error:', data.error)
        console.error('   Details:', data.details)
        console.error('   Error Name:', data.errorName)
        setError(data.error + (data.details ? ` (${data.details})` : ''))
        return
      }
      
      if (data.success && data.token) {
        localStorage.setItem('token', data.token)
        console.log('✅ Google Login thành công!')
        onLogin(data.data?.phone || data.data?.username)
        onClose()
      } else {
        setError(data.error || 'Đăng nhập Google thất bại')
      }
    } catch (err) {
      console.error('❌ Network Error:', err)
      console.error('   Message:', err.message)
      setError(`Lỗi kết nối: ${err.message}`)
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
        <button className="modal-close-btn" onClick={() => { resetForm(); setMode('login'); onClose(); }}>✕</button>

        <h2>
          {mode === 'login' ? 'Đăng Nhập' : mode === 'register' ? 'Đăng Ký' : 'Quên Mật Khẩu'}
        </h2>

        {error && <div className="modal-error-message">{error}</div>}
        {successMessage && <div style={{ color: '#4ade80', marginBottom: '1rem', textAlign: 'center' }}>{successMessage}</div>}

        <form onSubmit={handleSubmit}>
          {/* Số điện thoại - hiển thị ở tất cả các mode */}
          <div className="modal-form-group">
            <label>Số điện thoại</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={loading}
              placeholder="09xxxxxxxx"
            />
          </div>

          {/* Tên người dùng - chỉ ở register */}
          {mode === 'register' && (
            <div className="modal-form-group">
              <label>Tên người dùng (tùy chọn)</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                placeholder="Nhập tên của bạn"
              />
            </div>
          )}

          {/* Mật khẩu cũ / Mật khẩu mới */}
          {mode !== 'forgot' && (
            <div className="modal-form-group">
              <label>Password {mode === 'register' && <span style={{fontSize: '12px', color: '#666'}}>(ít nhất 8 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt)</span>}</label>
              <div className="modal-password-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                />
                <button
                  type="button"
                  className="modal-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {/* Hiển thị độ mạnh mật khẩu */}
              {mode === 'register' && password && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  Độ mạnh: <span style={{ color: getPasswordStrengthInfo(password).color, fontWeight: 'bold' }}>
                    {getPasswordStrengthInfo(password).label}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mật khẩu mới - chỉ ở forgot */}
          {mode === 'forgot' && (
            <div className="modal-form-group">
              <label>Mật khẩu mới <span style={{fontSize: '12px', color: '#666'}}>(ít nhất 8 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt)</span></label>
              <div className="modal-password-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                />
                <button
                  type="button"
                  className="modal-toggle-password"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {/* Hiển thị độ mạnh mật khẩu */}
              {newPassword && (
                <div style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
                  Độ mạnh: <span style={{ color: getPasswordStrengthInfo(newPassword).color, fontWeight: 'bold' }}>
                    {getPasswordStrengthInfo(newPassword).label}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Confirm Password - ở register và forgot */}
          {(mode === 'register' || mode === 'forgot') && (
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
            {loading ? 'Đang xử lý...' : (mode === 'login' ? 'Đăng Nhập' : mode === 'register' ? 'Đăng Ký' : 'Đặt lại mật khẩu')}
          </button>
        </form>

        {/* Quên mật khẩu - chỉ ở login */}
        {mode === 'login' && (
          <div className="modal-forgot-password">
            <a href="#forgot" onClick={(e) => { e.preventDefault(); resetForm(); setMode('forgot'); }}>Quên mật khẩu?</a>
          </div>
        )}

        {/* Chuyển mode - không ở forgot */}
        {mode !== 'forgot' && (
          <div className="modal-switch-mode">
            <p>
              {mode === 'login' ? 'Chưa có tài khoản? ' : 'Đã có tài khoản? '}
              <span onClick={() => {
                resetForm()
                setMode(mode === 'login' ? 'register' : 'login')
              }}>
                {mode === 'login' ? 'Đăng Ký Ngay' : 'Đăng Nhập'}
              </span>
            </p>
          </div>
        )}

        {/* Quay lại đăng nhập - chỉ ở forgot */}
        {mode === 'forgot' && (
          <div className="modal-switch-mode">
            <p>
              <span onClick={() => { resetForm(); setMode('login'); }}>Quay lại Đăng Nhập</span>
            </p>
          </div>
        )}

        {/* Google Login - chỉ ở login */}
        {mode === 'login' && (
          <>
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
          </>
        )}
      </div>
    </div>
  )
}

export default LoginModal
