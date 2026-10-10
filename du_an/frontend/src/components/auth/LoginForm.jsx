import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'

function LoginForm({
  scope = 'modal',
  email,
  setEmail,
  password,
  setPassword,
  loading = false,
  error = '',
  onSubmit,
  onGoogleSuccess,
  onGoogleError,
  onSwitchToRegister,
  onForgotPassword,
  showForgotPassword = false,
}) {
  const [showPassword, setShowPassword] = useState(false)

  const inputGroupClass = scope === 'modal' ? 'modal-form-group' : 'form-group'
  const passwordGroupClass = scope === 'modal' ? 'modal-password-group' : 'password-input-group'
  const togglePasswordClass = scope === 'modal' ? 'modal-toggle-password' : 'toggle-password'
  const submitButtonClass = scope === 'modal' ? 'modal-login-button' : 'login-button'
  const buttonLabel = scope === 'modal' ? 'Đăng Nhập' : 'Đăng nhập'

  return (
    <>
      {error && (
        <div className={scope === 'modal' ? 'modal-error-message' : 'error-message'}>
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} autoComplete="off">
        <div className={inputGroupClass}>
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={loading}
            placeholder="example@gmail.com"
            autoComplete="email"
          />
        </div>

        <div className={inputGroupClass}>
          <label>Mật khẩu</label>
          <div className={passwordGroupClass}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
              minLength={8}
              autoComplete="current-password"
              placeholder="Nhập mật khẩu"
            />
            <button
              type="button"
              className={togglePasswordClass}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <button type="submit" className={submitButtonClass} disabled={loading}>
          {loading ? 'Đang xử lý...' : buttonLabel}
        </button>
      </form>

      {showForgotPassword && onForgotPassword && (
        <div className={scope === 'modal' ? 'modal-forgot-password' : 'login-footer'}>
          <button
            type="button"
            onClick={onForgotPassword}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              color: scope === 'modal' ? '#93c5fd' : '#3b82f6',
              cursor: 'pointer',
              font: 'inherit',
              textDecoration: 'underline',
            }}
          >
            Quên mật khẩu?
          </button>
        </div>
      )}

      {onSwitchToRegister && (
        <div className={scope === 'modal' ? 'modal-switch-mode' : 'switch-mode'}>
          <p>
            Chưa có tài khoản?{' '}
            <span onClick={onSwitchToRegister} style={{ cursor: 'pointer' }}>
              Đăng ký ngay
            </span>
          </p>
        </div>
      )}

      {onGoogleSuccess && (
        <>
          <div className={scope === 'modal' ? 'modal-divider' : 'login-footer'}>
            {scope === 'modal' ? <span>hoặc</span> : <p>hoặc đăng nhập bằng Google</p>}
          </div>

          <div className={scope === 'modal' ? 'modal-oauth-buttons' : 'login-footer'}>
            {/* Thẻ div bọc giúp bao quát nút Google, ngăn chặn tình trạng lệch layout */}
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
              <GoogleLogin
                onSuccess={onGoogleSuccess}
                onError={onGoogleError}
                text="signin_with"
                // Sửa thành chuỗi số pixel hợp lệ (Google yêu cầu từ "200" đến "400")
                width={scope === 'modal' ? '350' : '400'}
                theme={scope === 'modal' ? 'filled_black' : 'outline'}
              />
            </div>
          </div>
        </>
      )}
    </>
  )
}

export default LoginForm
