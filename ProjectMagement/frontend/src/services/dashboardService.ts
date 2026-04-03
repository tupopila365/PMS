import { api } from './api'
import type { AuditLog, DashboardKPIs } from '../types'

export const dashboardService = {
  async getKPIs(projectId?: string): Promise<DashboardKPIs> {
    const { data } = await api.get<DashboardKPIs>('/dashboard/kpis', {
      params: projectId ? { projectId } : undefined,
    })
    return data
  },

  async getRecentActivity(limit?: number, projectId?: string): Promise<AuditLog[]> {
    const { data } = await api.get<AuditLog[]>('/dashboard/recent-activity', {
      params: {
        ...(limit != null ? { limit } : {}),
        ...(projectId ? { projectId } : {}),
      },
    })
    return data
  },
}
