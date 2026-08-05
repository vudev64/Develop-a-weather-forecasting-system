import { useState } from 'react'
import { authService } from '../../services/authService.js'

function ForgotPasswordForm({
  scope = 'modal',
  onBackToLogin,
}) {
  const [step, setStep] = useState(1) // 1: Request OTP, 2: Verify OTP, 3: Reset Password
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
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

  const handleRequestOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authService.requestOtp(phone, email)
      setSuccess('Mã OTP đã được gửi đến email của bạn.')
      setStep(2)
    } catch (err) {
      setError(err.message || 'Không thể gửi mã OTP. Vui lòng thử lại.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await authService.verifyOtp(phone, otp)
      setSuccess('Xác thực mã OTP thành công. Vui lòng nhập mật khẩu mới.')
      setStep(3)
    } catch (err) {
      setError(err.message || 'Mã OTP không đúng hoặc đã hết hạn.')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp.')
      return
    }
    setLoading(true)
    setError('')
    try {
      await authService.resetPassword(phone, newPassword, otp)
      setSuccess('Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.')
      setTimeout(() => {
        onBackToLogin()
      }, 2000)
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi đặt lại mật khẩu.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="forgot-password-form">
      {error && <div className={errorClass}>{error}</div>}
      {success && <div className="success-message" style={{ color: 'green', marginBottom: '10px' }}>{success}</div>}

      {step === 1 && (
        <form onSubmit={handleRequestOtp} autoComplete="off">
          <div className={inputGroupClass}>
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
          <div className={inputGroupClass}>
            <label>Email (để nhận OTP)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="example@gmail.com"
            />
          </div>
          <button type="submit" className={submitButtonClass} disabled={loading}>
            {loading ? 'Đang gửi...' : 'Gửi mã OTP'}
          </button>
        </form>
      )}

      {step === 2 && (
        <form onSubmit={handleVerifyOtp} autoComplete="off">
          <div className={inputGroupClass}>
            <label>Nhập mã OTP (6 số)</label>
            <input
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              required
              disabled={loading}
              placeholder="123456"
              maxLength={6}
            />
          </div>
          <button type="submit" className={submitButtonClass} disabled={loading}>
            {loading ? 'Đang xác thực...' : 'Xác thực OTP'}
          </button>
          <button 
            type="button" 
            className="text-button" 
            onClick={() => setStep(1)} 
            style={{ marginTop: '10px', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
          >
            Quay lại bước trước
          </button>
        </form>
      )}

      {step === 3 && (
        <form onSubmit={handleResetPassword} autoComplete="off">
          <div className={inputGroupClass}>
            <label>Mật khẩu mới</label>
            <div className={passwordGroupClass}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
                placeholder="Nhập mật khẩu mới"
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
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={8}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>
          </div>

          <button type="submit" className={submitButtonClass} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đặt lại mật khẩu'}
          </button>
        </form>
      )}

      {onBackToLogin && (
        <div className={scope === 'modal' ? 'modal-switch-mode' : 'switch-mode'}>
          <p>
            <span onClick={onBackToLogin} style={{ cursor: 'pointer', color: '#2563eb' }}>Quay lại Đăng Nhập</span>
          </p>
        </div>
      )}
    </div>
  )
}

export default ForgotPasswordForm