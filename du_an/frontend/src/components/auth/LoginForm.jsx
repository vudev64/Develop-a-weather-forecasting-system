import { useState } from 'react'
import { GoogleLogin } from '@react-oauth/google'

function LoginForm({
  scope = 'modal',
  phone,
  setPhone,
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
          <label>Số điện thoại</label>
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            required
            disabled={loading}
            placeholder="09xxxxxxxx"
            autoComplete="tel"
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
            <span onClick={onSwitchToRegister}>
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
            <GoogleLogin
              onSuccess={onGoogleSuccess}
              onError={onGoogleError}
              text="signin_with"
              width={scope === 'modal' ? '100%' : undefined}
              theme={scope === 'modal' ? 'filled_black' : 'outline'}
            />
          </div>
        </>
      )}
    </>
  )
}

export default LoginForm