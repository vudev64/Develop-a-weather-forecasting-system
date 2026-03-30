import { useState } from 'react'
import './App.css'
import PublicHome from './PublicHome'
import Dashboard from './Dashboard'
import LoginModal from './LoginModal'

function App() {
  const [currentPage, setCurrentPage] = useState('public')
  const [username, setUsername] = useState('')
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const handleOpenLoginModal = () => {
    setIsLoginModalOpen(true)
  }

  const handleCloseLoginModal = () => {
    setIsLoginModalOpen(false)
  }

  const handleLogin = (user) => {
    setUsername(user)
    setCurrentPage('dashboard')
    setIsLoginModalOpen(false)
  }

  const handleLogout = () => {
    setUsername('')
    setCurrentPage('public')
  }

  if (currentPage === 'public') {
    return (
      <>
        <PublicHome onGoToLogin={handleOpenLoginModal} />
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={handleCloseLoginModal}
          onLogin={handleLogin}
        />
      </>
    )
  }

  return <Dashboard username={username} onLogout={handleLogout} />
}

export default App
