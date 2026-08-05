import { useState } from 'react'

function RegisterForm({
  scope = 'modal',
  phone,
  setPhone,
  username,
  setUsername,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  loading = false,
  error = '',
  success = '',
  onSubmit,
  onSwitchToLogin,
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const inputGroupClass = scope === 'modal' ? 'modal-form-group' : 'form-group'
  const passwordGroupClass = scope === 'modal' ? 'modal-password-group' : 'password-input-group'
  const togglePasswordClass = scope === 'modal' ? 'modal-toggle-password' : 'toggle-password'
  const submitButtonClass = scope === 'modal' ? 'modal-login-button' : 'login-button'
  const errorClass = scope === 'modal' ? 'modal-error-message' : 'error-message'
  const successClass = scope === 'modal' ? '' : 'success-message'
  const titleHint = scope === 'modal'
    ? ' (ít nhất 8 ký tự, có chữ hoa, chữ thường, số, ký tự đặc biệt)'
    : ''

  return (
    <>
      {error && <div className={errorClass}>{error}</div>}
      {success && <div className={successClass} style={scope === 'modal' ? { color: '#4ade80', marginBottom: '1rem', textAlign: 'center' } : undefined}>{success}</div>}

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
          <label>Tên người dùng (tùy chọn)</label>
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            disabled={loading}
            placeholder="Nhập tên của bạn"
            autoComplete="nickname"
          />
        </div>

        <div className={inputGroupClass}>
          <label>Mật khẩu{titleHint}</label>
          <div className={passwordGroupClass}>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={loading}
              minLength={8}
              autoComplete="new-password"
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

        <div className={inputGroupClass}>
          <label>Xác nhận mật khẩu</label>
          <div className={passwordGroupClass}>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              disabled={loading}
              minLength={8}
              autoComplete="new-password"
              placeholder="Nhập lại mật khẩu"
            />
            <button
              type="button"
              className={togglePasswordClass}
              onClick={() => setShowConfirmPassword((current) => !current)}
            >
              {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
        </div>

        <button type="submit" className={submitButtonClass} disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Đăng Ký'}
        </button>
      </form>

      {onSwitchToLogin && (
        <div className={scope === 'modal' ? 'modal-switch-mode' : 'switch-mode'}>
          <p>
            Đã có tài khoản?{' '}
            <span onClick={onSwitchToLogin}>
              Đăng nhập ngay
            </span>
          </p>
        </div>
      )}
    </>
  )
}

export default RegisterForm