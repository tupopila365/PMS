import { useAuth } from '../context/AuthContext'
import { hasPermission, type Permission } from '../utils/permissions'

export function usePermissions() {
  const { user } = useAuth()
  const role = user?.role ?? 'contractor'

  return {
    can: (permission: Permission) => hasPermission(role, permission),
    role,
  }
}
