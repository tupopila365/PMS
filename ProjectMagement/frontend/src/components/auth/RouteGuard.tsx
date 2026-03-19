import { useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { canAccessRoute } from '../../utils/permissions'
import type { UserRole } from '../../types'

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { user } = useAuth()
  const path = location.pathname

  if (!user) return <>{children}</>

  const allowed = canAccessRoute(user.role as UserRole, path)
  if (!allowed) {
    return <Navigate to="/dashboard" replace state={{ from: path }} />
  }

  return <>{children}</>
}
