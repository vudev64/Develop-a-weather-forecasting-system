import { Navigate } from 'react-router-dom'

function ProtectedRoute({ children, isAuthenticated, loading }) {
  if (loading) {
    return null
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />
  }

  return children
}

export default ProtectedRoute
