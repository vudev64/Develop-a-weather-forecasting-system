import { useState } from 'react'
import './Login.css'
import { authService } from './services/authService.js'
import LoginForm from './components/auth/LoginForm.jsx'
import RegisterForm from './components/auth/RegisterForm.jsx'

function Login({ onLogin }) {
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
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
        await authService.register(email, password, username)
        setSuccess('Đăng ký thành công. Vui lòng đăng nhập.')
        setEmail('')
        setUsername('')
        setPassword('')
        setConfirmPassword('')
        setIsRegister(false)
      } catch (err) {
        setError(err.message || 'Đăng ký thất bại')
      }
    } else {
      try {
        const data = await authService.login(email, password)
        localStorage.setItem('token', data.token || '')
        localStorage.setItem('username', data.data?.username || data.data?.email || email)
        onLogin(data.data?.email || email)
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
        localStorage.setItem('username', data.data?.username || data.data?.email || '')
        onLogin(data.data?.email || data.data?.username)
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
        <p>{isRegister ? 'Tạo tài khoản mới bằng email' : 'Đăng nhập để sử dụng dự báo thời tiết'}</p>

        {isRegister ? (
          <RegisterForm
            scope="page"
            email={email}
            setEmail={setEmail}
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
              setEmail('')
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
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={setPassword}
            loading={loading}
            error={error}
            onSubmit={handleSubmit}
            onGoogleSuccess={handleGoogleSuccess}
            onGoogleError={handleGoogleError}
            onSwitchToRegister={() => {
              setIsRegister(true)
              setEmail('')
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