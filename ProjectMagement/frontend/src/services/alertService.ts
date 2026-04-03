import { api } from './api'
import type { RiskAlert } from '../types'

export const alertService = {
  async getRiskAlerts(projectId?: string): Promise<RiskAlert[]> {
    const { data } = await api.get<RiskAlert[]>('/alerts/risk', {
      params: projectId ? { projectId } : undefined,
    })
    return data
  },
}
