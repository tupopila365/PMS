import { api, USE_MOCK } from './api'
import { mockRiskAlerts, mockRisks, mockProjects } from '../mocks/data'
import type { RiskAlert } from '../types'

export const alertService = {
  async getRiskAlerts(): Promise<RiskAlert[]> {
    if (USE_MOCK) {
      const fromRegister = mockRisks
        .filter((r) => (r.severity === 'high' || r.severity === 'critical') && r.status !== 'closed')
        .map((r) => {
          const project = mockProjects.find((p) => p.id === r.projectId)
          return {
            id: 'alert-from-' + r.id,
            projectId: r.projectId,
            projectName: project?.name || 'Unknown',
            message: r.description,
            type: 'cost' as const,
            severity: (r.severity === 'critical' ? 'high' : 'medium') as RiskAlert['severity'],
          }
        })
      const staticAlerts = mockRiskAlerts
      return [...fromRegister, ...staticAlerts].slice(0, 10)
    }
    const { data } = await api.get<RiskAlert[]>('/alerts/risk')
    return data
  },
}
