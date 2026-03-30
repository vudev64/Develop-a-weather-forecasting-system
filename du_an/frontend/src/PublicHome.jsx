import './PublicHome.css'
import PublicMap from './PublicMap'

function PublicHome({ onGoToLogin }) {
  return (
    <div className="public-home">
      <div className="public-header">
        <h1>🗺️ Bản Đồ Thời Tiết Toàn Cầu</h1>
        <button onClick={onGoToLogin} className="login-btn">
          Đăng nhập / Đăng ký
        </button>
      </div>

      {/* Public Map - Hiển thị ngay khi vừa vào */}
      <PublicMap />

      {/* Tìm hiểu thêm section */}
      <div className="public-info-section">
        <h3>Muốn xem chi tiết hơn?</h3>
        <p>Đăng nhập để lưu vị trí yêu thích, theo dõi dự báo dài hạn và nhận thông báo cảnh báo thời tiết</p>
        <button onClick={onGoToLogin} className="cta-btn">
          Đăng Nhập Ngay
        </button>
      </div>
    </div>
  )
}

export default PublicHome
