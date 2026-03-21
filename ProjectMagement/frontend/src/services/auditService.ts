import { api } from './api'
import { getJwtClaims } from '../utils/jwtPayload'
import type { AuditLog, AuditAction } from '../types'

function getCurrentUserForAudit(): { id: string; name: string } {
  const { sub, name } = getJwtClaims()
  return { id: sub || 'unknown', name: name || 'User' }
}

export const auditService = {
  async getRecentActivity(limit?: number): Promise<AuditLog[]> {
    const { data } = await api.get<AuditLog[]>('/audit/recent', { params: { limit } })
    return data
  },

  log(action: AuditAction, entityType: string, projectId: string, projectName: string, entityId?: string): void {
    const { id: userId, name: userName } = getCurrentUserForAudit()
    const entry: AuditLog = {
      id: 'audit-' + Date.now(),
      userId,
      userName,
      action,
      entityType,
      entityId,
      projectId,
      projectName,
      timestamp: new Date().toISOString(),
    }
    api.post('/audit/log', entry).catch(() => {})
  },
}
