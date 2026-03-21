import { api } from './api'
import type { Risk } from '../types'

export const riskService = {
  async getRisks(projectId?: string): Promise<Risk[]> {
    const params = projectId ? { projectId } : {}
    const { data } = await api.get<Risk[]>('/risks', { params })
    return data
  },

  async createRisk(risk: Omit<Risk, 'id'>): Promise<Risk> {
    const { data } = await api.post<Risk>('/risks', risk)
    return data
  },

  async updateRisk(id: string, updates: Partial<Risk>): Promise<Risk> {
    const { data } = await api.put<Risk>(`/risks/${id}`, updates)
    return data
  },

  async deleteRisk(id: string): Promise<void> {
    await api.delete(`/risks/${id}`)
  },
}
