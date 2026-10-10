import { useState } from 'react'
import './LoginModal.css'
import { authService } from './services/authService.js'
import LoginForm from './components/auth/LoginForm.jsx'
import RegisterForm from './components/auth/RegisterForm.jsx'
import ForgotPasswordForm from './components/auth/ForgotPasswordForm.jsx'

function LoginModal({ isOpen, onClose, onLogin }) {
  const [mode, setMode] = useState('login') // 'login', 'register', 'forgot'
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const resetForm = () => {
    setError('')
    setSuccessMessage('')
    setEmail('')
    setUsername('')
    setPassword('')
    setConfirmPassword('')
  }

  const renderTitle = () => {
    switch (mode) {
      case 'register': return 'Đăng Ký'
      case 'forgot': return 'Quên Mật Khẩu'
      default: return 'Đăng Nhập'
    }
  }


  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')
    setLoading(true)

    try {
      if (mode === 'register' && password !== confirmPassword) {
        setError('Mật khẩu không khớp!')
        return
      }

      if (mode === 'register' && password.length < 8) {
        setError('Mật khẩu phải đủ mạnh: ít nhất 8 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt!')
        return
      }

      if (mode === 'login') {
        const data = await authService.login(email, password)
        localStorage.setItem('token', data.token || '')
        localStorage.setItem('username', data.data?.username || data.data?.email || email)
        onLogin(data.data?.email || email)
        onClose()
        return
      } else if (mode === 'register') {
        await authService.register(email, password, username)
        setSuccessMessage('Đăng ký thành công. Vui lòng đăng nhập lại.')
        setTimeout(() => {
          resetForm()
          setMode('login')
        }, 0)
        return
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập/đăng ký thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true)
    setError('')
    try {
      const data = await authService.verifyGoogleToken(credentialResponse.credential)

      if (data.success && data.token) {
        localStorage.setItem('token', data.token)
        localStorage.setItem('username', data.data?.username || data.data?.email || '')
        onLogin(data.data?.email || data.data?.username)
        onClose()
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
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={() => { resetForm(); setMode('login'); onClose(); }}>✕</button>

                <h2>{renderTitle()}</h2>

        {mode === 'login' && (
          <LoginForm
            scope="modal"
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
              resetForm()
              setMode('register')
            }}
                        onForgotPassword={() => {
              resetForm()
              setMode('forgot')
            }}
            showForgotPassword={true}
          />

        )}

        {mode === 'register' && (
          <RegisterForm
            scope="modal"
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
            success={successMessage}
            onSubmit={handleSubmit}
            onSwitchToLogin={() => {
              resetForm()
              setMode('login')
            }}
          />
        )}

        {mode === 'forgot' && (
          <ForgotPasswordForm
            scope="modal"
            onBackToLogin={() => {
              resetForm()
              setMode('login')
            }}
          />
        )}
      </div>
    </div>
  )
}


export default LoginModal
