import { useState } from 'react'
import './Login.css'
import { authService } from './services/authService.js'
import LoginForm from './components/auth/LoginForm.jsx'
import RegisterForm from './components/auth/RegisterForm.jsx'

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false)
  const [phone, setPhone] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    
    if (isRegister) {
      if (password !== confirmPassword) {
        setError('Mật khẩu xác nhận không khớp')
        return
      }
      if (password.length < 8) {
        setError('Mật khẩu phải có ít nhất 8 ký tự')
        return
      }
      
      try {
        await authService.register(phone, password, username)
        setSuccess('Đăng ký thành công. Vui lòng đăng nhập.')
        setPhone('')
        setUsername('')
        setPassword('')
        setConfirmPassword('')
        setIsRegister(false)
      } catch (err) {
        setError(err.message || 'Đăng ký thất bại')
      }
    } else {
      try {
        const data = await authService.login(phone, password)
        localStorage.setItem('token', data.token || '')
        localStorage.setItem('phone', data.data?.phone || phone)
        localStorage.setItem('username', data.data?.username || data.data?.phone || phone)
        onLogin(data.data?.phone || phone)
      } catch (err) {
        setError(err.message || 'Đăng nhập thất bại')
      }
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true)
      setError('')
      const data = await authService.verifyGoogleToken(credentialResponse.credential)

      if (data.success && data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('phone', data.data?.phone || data.data?.username || '')
        localStorage.setItem('username', data.data?.username || data.data?.phone || '')
        onLogin(data.data?.phone || data.data?.username)
      } else {
        setError(data.error || 'Đăng nhập Google thất bại')
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập Google thất bại')
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
        <p>{isRegister ? 'Tạo tài khoản mới bằng số điện thoại' : 'Đăng nhập để sử dụng dự báo thời tiết'}</p>

        {isRegister ? (
          <RegisterForm
            scope="page"
            phone={phone}
            setPhone={setPhone}
            username={username}
            setUsername={setUsername}
            password={password}
            setPassword={setPassword}
            confirmPassword={confirmPassword}
            setConfirmPassword={setConfirmPassword}
            loading={loading}
            error={error}
            success={success}
            onSubmit={handleSubmit}
            onSwitchToLogin={() => {
              setIsRegister(false)
              setPhone('')
              setUsername('')
              setPassword('')
              setConfirmPassword('')
              setError('')
              setSuccess('')
            }}
          />
        ) : (
          <LoginForm
            scope="page"
            phone={phone}
            setPhone={setPhone}
            password={password}
            setPassword={setPassword}
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
            onGoogleSuccess={handleGoogleSuccess}
            onGoogleError={handleGoogleError}
            onSwitchToRegister={() => {
              setIsRegister(true)
              setPhone('')
              setUsername('')
              setPassword('')
              setConfirmPassword('')
              setError('')
              setSuccess('')
            }}
            showForgotPassword={false}
          />
        )}
      </div>
    </div>
  )
}

export default Login