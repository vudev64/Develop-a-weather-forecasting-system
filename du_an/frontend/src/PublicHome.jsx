import './PublicHome.css'
import PublicMap from './PublicMap'

function PublicHome({ onGoToLogin, isAuthenticated }) {
  return (
    <div className="public-home">
      <div className="public-header">
        <h1>🗺️ Bản Đồ Thời Tiết Toàn Cầu</h1>
        <button onClick={onGoToLogin} className="login-btn">
          Đăng nhập / Đăng ký
        </button>
      </div>

      {/* Public Map - Hiển thị ngay khi vừa vào */}
      <PublicMap onRequireLogin={onGoToLogin} isAuthenticated={isAuthenticated} />

      {/* Tìm hiểu thêm section */}
      <div className="public-info-section">
        <h3>Quản lý địa điểm của bạn</h3>
        <p>Đăng nhập để lưu lịch sử tìm kiếm và quản lý các địa điểm yêu thích.</p>
        <button onClick={onGoToLogin} className="cta-btn">
          Đăng nhập
        </button>
      </div>
    </div>
  )
}

export default PublicHome
