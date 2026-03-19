import { api, USE_MOCK } from './api'
import { mockStakeholders } from '../mocks/data'
import type { Stakeholder } from '../types'

export const stakeholderService = {
  async getStakeholders(projectId: string): Promise<Stakeholder[]> {
    if (USE_MOCK) return mockStakeholders.filter((s) => s.projectId === projectId)
    const { data } = await api.get<Stakeholder[]>(`/projects/${projectId}/stakeholders`)
    return data
  },

  async createStakeholder(entry: Omit<Stakeholder, 'id'>): Promise<Stakeholder> {
    if (USE_MOCK) {
      const newSt: Stakeholder = { ...entry, id: 'st-' + Date.now() }
      mockStakeholders.push(newSt)
      return newSt
    }
    const { data } = await api.post<Stakeholder>(`/projects/${entry.projectId}/stakeholders`, entry)
    return data
  },

  async updateStakeholder(id: string, projectId: string, updates: Partial<Stakeholder>): Promise<Stakeholder> {
    if (USE_MOCK) {
      const s = mockStakeholders.find((x) => x.id === id)
      if (!s) throw new Error('Not found')
      Object.assign(s, updates)
      return s
    }
    const { data } = await api.put<Stakeholder>(`/projects/${projectId}/stakeholders/${id}`, updates)
    return data
  },
}
