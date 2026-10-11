import { useState } from 'react'
import { authService } from '../../services/authService.js'

function ForgotPasswordForm({
  scope = 'modal',
  onBackToLogin,
  resetToken = '',
}) {
  const [email, setEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const inputGroupClass = scope === 'modal' ? 'modal-form-group' : 'form-group'
  const passwordGroupClass = scope === 'modal' ? 'modal-password-group' : 'password-input-group'
  const togglePasswordClass = scope === 'modal' ? 'modal-toggle-password' : 'toggle-password'
  const submitButtonClass = scope === 'modal' ? 'modal-login-button' : 'login-button'
  const errorClass = scope === 'modal' ? 'modal-error-message' : 'error-message'

  const handleRequestReset = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await authService.requestPasswordReset(email)
      setSuccess('Nếu email đã đăng ký, bạn sẽ nhận được link đặt lại mật khẩu.')
    } catch (requestError) {
      setError(requestError.message || 'Không thể gửi link đặt lại mật khẩu. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (event) => {
    event.preventDefault()

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await authService.resetPassword(resetToken, newPassword)
      setSuccess('Đổi mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.')
    } catch (requestError) {
      setError(requestError.message || 'Link đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgot-password-form">
      {error && <div className={errorClass}>{error}</div>}
      {success && <div className="success-message" style={{ color: 'green', marginBottom: '10px' }}>{success}</div>}

      {resetToken ? (
        success ? null : (
          <form onSubmit={handleResetPassword} autoComplete="off">
            <div className={inputGroupClass}>
              <label>Mật khẩu mới</label>
              <div className={passwordGroupClass}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(event) => setNewPassword(event.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                  placeholder="Nhập mật khẩu mới"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className={inputGroupClass}>
              <label>Xác nhận mật khẩu</label>
              <div className={passwordGroupClass}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  disabled={loading}
                  minLength={8}
                  placeholder="Nhập lại mật khẩu"
                  autoComplete="new-password"
                />
              </div>
            </div>
            <button
              type="button"
              className={togglePasswordClass}
              onClick={() => setShowPassword((current) => !current)}
            >
              {showPassword ? 'Ẩn mật khẩu' : '👁 Hiện cả hai mật khẩu'}
            </button>

            <p>Mật khẩu cần có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.</p>
            <button type="submit" className={submitButtonClass} disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
            </button>
          </form>
        )
      ) : (
        !success && (
          <form onSubmit={handleRequestReset} autoComplete="off">
            <div className={inputGroupClass}>
              <label>Email tài khoản</label>
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
            <button type="submit" className={submitButtonClass} disabled={loading}>
              {loading ? 'Đang gửi...' : 'Gửi link đặt lại mật khẩu'}
            </button>
          </form>
        )
      )}

      {onBackToLogin && (
        <div className={scope === 'modal' ? 'modal-switch-mode' : 'switch-mode'}>
          <p>
            <span onClick={onBackToLogin} style={{ cursor: 'pointer', color: '#2563eb' }}>
              Quay lại Đăng Nhập
            </span>
          </p>
        </div>
      )}
    </div>
  )
}

export default ForgotPasswordForm
