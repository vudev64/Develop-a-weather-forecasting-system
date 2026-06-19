import { useState, useEffect, useRef } from 'react'
import './UserAvatarMenu.css' 

function UserAvatarMenu({ username, userInfo, onLogout }) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef(null)

  // ✅ SỬA Ở ĐÂY: Lấy username làm tên hiển thị, fallback sang phone
  const displayName = userInfo?.username || userInfo?.phone || username || 'Khách'
  const displayPhone = userInfo?.phone || username || ''
  
  // Xử lý an toàn nếu displayName vẫn rỗng
  const avatarLetter = displayName ? displayName.charAt(0).toUpperCase() : '?'

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="user-avatar-menu" ref={menuRef}>
      <button className="avatar-btn" onClick={() => setIsOpen(!isOpen)}>
        <span className="avatar-circle">{avatarLetter}</span>
      </button>

      {isOpen && (
        <div className="avatar-dropdown">
          {/* Header hiển thị Avatar và Tên */}
          <div className="avatar-dropdown-header">
            <span className="avatar-circle avatar-circle-large">{avatarLetter}</span>
            <div>
              {/* Hiển thị Tên người dùng */}
              <div className="dropdown-username">{displayName}</div>
              {userInfo?.email && <div className="dropdown-email">{userInfo.email}</div>}
            </div>
          </div>

          {/* Nội dung Tab Thông tin */}
          <div className="avatar-dropdown-content">
            <div className="info-tab">
              {/* Hiển thị Số điện thoại */}
              {displayPhone && (
                <div className="info-row">
                  <span className="info-label">Số điện thoại:</span>
                  <span className="info-value">{displayPhone}</span>
                </div>
              )}
              
              {userInfo?.email && (
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span className="info-value">{userInfo.email}</span>
                </div>
              )}
              {userInfo?.createdAt && (
                <div className="info-row">
                  <span className="info-label">Tham gia:</span>
                  <span className="info-value">
                    {new Date(userInfo.createdAt).toLocaleDateString('vi-VN')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Nút Đăng xuất */}
          <button 
            className="dropdown-logout-btn" 
            onClick={() => { 
              setIsOpen(false)
              onLogout() 
            }}
          >
            Đăng xuất
          </button>
        </div>
      )}
    </div>
  )
}

export default UserAvatarMenu