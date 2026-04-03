import { useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { canAccessRoute, getDefaultLandingPath } from '../../utils/permissions'
import type { UserRole } from '../../types'

export function RouteGuard({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const { user } = useAuth()
  const path = location.pathname

  if (!user) return <>{children}</>

  const role = user.role as UserRole
  const allowed = canAccessRoute(role, path)
  if (!allowed) {
    const fallback = getDefaultLandingPath(role)
    if (path !== fallback && canAccessRoute(role, fallback)) {
      return <Navigate to={fallback} replace state={{ from: path }} />
    }
    return <Navigate to="/login" replace state={{ from: path }} />
  }

  return <>{children}</>
}
