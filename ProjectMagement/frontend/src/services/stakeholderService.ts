import { api } from './api'
import type { Stakeholder } from '../types'

export const stakeholderService = {
  async getStakeholders(projectId: string): Promise<Stakeholder[]> {
    const { data } = await api.get<Stakeholder[]>(`/projects/${projectId}/stakeholders`)
    return data
  },

  async createStakeholder(entry: Omit<Stakeholder, 'id'>): Promise<Stakeholder> {
    const { data } = await api.post<Stakeholder>(`/projects/${entry.projectId}/stakeholders`, entry)
    return data
  },

  async updateStakeholder(id: string, projectId: string, updates: Partial<Stakeholder>): Promise<Stakeholder> {
    const { data } = await api.put<Stakeholder>(`/projects/${projectId}/stakeholders/${id}`, updates)
    return data
  },
}
