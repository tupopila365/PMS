import { api, USE_MOCK } from './api'
import { mockRisks, mockProjects } from '../mocks/data'
import { auditService } from './auditService'
import type { Risk } from '../types'

export const riskService = {
  async getRisks(projectId?: string): Promise<Risk[]> {
    if (USE_MOCK) return projectId ? mockRisks.filter((r) => r.projectId === projectId) : mockRisks
    const params = projectId ? { projectId } : {}
    const { data } = await api.get<Risk[]>('/risks', { params })
    return data
  },

  async createRisk(risk: Omit<Risk, 'id'>): Promise<Risk> {
    if (USE_MOCK) {
      const newRisk: Risk = { ...risk, id: 'risk-' + Date.now() }
      mockRisks.push(newRisk)
      const project = mockProjects.find((p) => p.id === risk.projectId)
      auditService.log('risk_created', 'risk', risk.projectId, project?.name || 'Unknown', newRisk.id)
      return newRisk
    }
    const { data } = await api.post<Risk>('/risks', risk)
    return data
  },

  async updateRisk(id: string, updates: Partial<Risk>): Promise<Risk> {
    if (USE_MOCK) {
      const r = mockRisks.find((x) => x.id === id)
      if (!r) throw new Error('Not found')
      Object.assign(r, updates)
      const project = mockProjects.find((p) => p.id === r.projectId)
      auditService.log('risk_updated', 'risk', r.projectId, project?.name || 'Unknown', id)
      return r
    }
    const { data } = await api.put<Risk>(`/risks/${id}`, updates)
    return data
  },

  async deleteRisk(id: string): Promise<void> {
    if (USE_MOCK) {
      const i = mockRisks.findIndex((x) => x.id === id)
      if (i >= 0) mockRisks.splice(i, 1)
      return
    }
    await api.delete(`/risks/${id}`)
  },
}
