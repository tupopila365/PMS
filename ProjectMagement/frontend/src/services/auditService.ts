import { api, USE_MOCK } from './api'
import { mockAuditLogs, mockUsers } from '../mocks/data'
import type { AuditLog, AuditAction } from '../types'

function getCurrentUserForAudit(): { id: string; name: string } {
  const token = localStorage.getItem('token')
  if (USE_MOCK && token?.startsWith('mock-token-')) {
    const userId = token.replace('mock-token-', '')
    const user = mockUsers.find((u) => u.id === userId)
    if (user) return { id: user.id, name: user.name }
  }
  return { id: 'system', name: 'System' }
}

export const auditService = {
  async getRecentActivity(limit?: number): Promise<AuditLog[]> {
    if (USE_MOCK) {
      const sorted = [...mockAuditLogs].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      return limit ? sorted.slice(0, limit) : sorted
    }
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
    if (USE_MOCK) {
      mockAuditLogs.unshift(entry)
      if (mockAuditLogs.length > 100) mockAuditLogs.pop()
    } else {
      api.post('/audit/log', entry).catch(() => {})
    }
  },
}
