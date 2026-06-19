import { useState, useEffect } from 'react'
import './Login.css'
import { GoogleLogin } from '@react-oauth/google'

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // Clear form khi component mount
  useEffect(() => {
    setPhone('')
    setPassword('')
    setConfirmPassword('')
    setError('')
    setSuccess('')
  }, [])

  // Xử lý phím Enter
  const handleKeyPress = (e, fieldType) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      
      if (fieldType === 'phone') {
        document.getElementById('password-input').focus()
      } else if (fieldType === 'password' && !isRegister) {
        // Submit form khi nhấn Enter ở password (đăng nhập)
        handleSubmit(e)
      } else if (fieldType === 'password' && isRegister) {
        // Focus sang confirm password khi nhấn Enter ở password (đăng ký)
        document.getElementById('confirm-password-input').focus()
      } else if (fieldType === 'confirmPassword') {
        // Submit form khi nhấn Enter ở confirm password
        handleSubmit(e)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (phone === '' || password === '') {
      setError('Vui lòng nhập đầy đủ thông tin')
      return
    }

    if (isRegister) {
      // Xử lý đăng ký
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp')
        return
      }
      if (password.length < 3) {
        setError('Mật khẩu phải có ít nhất 3 ký tự')
        return
      }
      
      try {
        console.log('📝 Đang đăng ký...')
        const response = await fetch('http://localhost:5000/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password })
        })
        const data = await response.json()
        console.log('✅ Response:', data)
        
        if (data.success || response.ok) {
          setSuccess('✅ Đăng ký thành công! Vui lòng đăng nhập.')
          setPhone('')
          setPassword('')
          setConfirmPassword('')
          setIsRegister(false)  // Quay lại form login
        } else {
          setError(data.message || data.error || 'Đăng ký thất bại')
        }
      } catch (err) {
        console.error('❌ Error:', err)
        setError(`Lỗi kết nối: ${err.message}\n\nĐảm bảo Backend chạy trên http://localhost:5000`)
      }
    } else {
      // Xử lý đăng nhập
      try {
        console.log('📝 Đang đăng nhập...')
        const response = await fetch('http://localhost:5000/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone, password })
        })
        const data = await response.json()
        console.log('✅ Response:', data)
        
        if (data.success || response.ok) {
          localStorage.setItem('token', data.token || '')
          localStorage.setItem('phone', phone)
          console.log('✅ Đăng nhập thành công')
          onLogin(phone)  // Chỉ login khi đăng nhập thành công
        } else {
          setError(data.message || data.error || 'Đăng nhập thất bại')
        }
      } catch (err) {
        console.error('❌ Error:', err)
        setError(`Lỗi kết nối: ${err.message}\n\nĐảm bảo Backend chạy trên http://localhost:5000`)
      }
    }
  }

  // Xử lý Google Login
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true)
      setError('')
      
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
        onLogin(data.user.phone)
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
    <div className="login-container">
      <div className="login-box">
        <h2>{isRegister ? 'Đăng Ký' : 'Đăng Nhập'}</h2>
        <p>{isRegister ? 'Tạo tài khoản mới' : 'Đăng nhập để sử dụng dự báo thời tiết'}</p>
        
        {/* Google Login Button */}
        {!isRegister && (
          <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'center' }}>
            {loading ? (
              <p style={{ color: '#999' }}>Đang đăng nhập...</p>
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                text="signin_with"
                theme="dark"
                size="large"
              />
            )}
          </div>
        )}

        {/* Divider */}
        {!isRegister && (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            margin: '20px 0',
            gap: '10px'
          }}>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#666' }}></div>
            <span style={{ color: '#999', fontSize: '12px' }}>hoặc</span>
            <div style={{ flex: 1, height: '1px', backgroundColor: '#666' }}></div>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-group">
            <label>Tên đăng nhập:</label>
            <input 
              type="text" 
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyPress={(e) => handleKeyPress(e, 'phone')}
              placeholder="Nhập tên đăng nhập"
              autoComplete="off"
              id="phone-input"
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu:</label>
            <div className="password-input-group">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => handleKeyPress(e, 'password')}
                placeholder="Nhập mật khẩu"
                autoComplete="new-password"
                id="password-input"
              />
              <button
                type="button"
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="form-group">
              <label>Xác nhận mật khẩu:</label>
              <div className="password-input-group">
                <input 
                  type={showConfirmPassword ? "text" : "password"} 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={(e) => handleKeyPress(e, 'confirmPassword')}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                  id="confirm-password-input"
                />
                <button
                  type="button"
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  tabIndex="-1"
                >
                  {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
            </div>
          )}

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <button type="submit" className="login-button">
            {isRegister ? 'Đăng ký' : 'Đăng nhập'}
          </button>
        </form>

        <div className="switch-mode">
          {isRegister ? (
            <p>
              Đã có tài khoản?{' '}
              <span onClick={() => { 
                setIsRegister(false)
                setPhone('')
                setPassword('')
                setConfirmPassword('')
                setError('')
                setSuccess('')
                setShowPassword(false)
                setShowConfirmPassword(false)
              }}>
                Đăng nhập ngay
              </span>
            </p>
          ) : (
            <p>
              Chưa có tài khoản?{' '}
              <span onClick={() => { 
                setIsRegister(true)
                setPhone('')
                setPassword('')
                setConfirmPassword('')
                setError('')
                setSuccess('')
                setShowPassword(false)
                setShowConfirmPassword(false)
              }}>
                Đăng ký ngay
              </span>
            </p>
          )}
        </div>


      </div>
    </div>
  )
}

export default Login