import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import '../../Login.css'
import ForgotPasswordForm from './ForgotPasswordForm.jsx'

function ResetPasswordPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const resetToken = new URLSearchParams(location.hash.slice(1)).get('token') || ''

  useEffect(() => {
    if (resetToken) {
      window.history.replaceState(window.history.state, '', location.pathname)
    }
  }, [location.pathname, resetToken])

  const backToLogin = () => navigate('/login', { replace: true })

  return (
    <div className="login-container">
      <div className="login-box">
        <h2>Đặt Lại Mật Khẩu</h2>
        {resetToken ? (
          <>
            <p>Nhập mật khẩu mới cho tài khoản của bạn.</p>
            <ForgotPasswordForm
              scope="page"
              resetToken={resetToken}
              onBackToLogin={backToLogin}
            />
          </>
        ) : (
          <>
            <p>Link đặt lại mật khẩu không hợp lệ hoặc không còn trong địa chỉ trang.</p>
            <button type="button" className="login-button" onClick={backToLogin}>
              Quay lại đăng nhập
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ResetPasswordPage
