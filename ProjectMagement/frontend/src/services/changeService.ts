import { api } from './api'
import type { ChangeRequest } from '../types'

export const changeService = {
  async getChanges(projectId?: string): Promise<ChangeRequest[]> {
    const params = projectId ? { projectId } : {}
    const { data } = await api.get<ChangeRequest[]>('/changes', { params })
    return data
  },

  async createChange(change: Omit<ChangeRequest, 'id'>): Promise<ChangeRequest> {
    const { data } = await api.post<ChangeRequest>('/changes', change)
    return data
  },

  async updateChange(id: string, updates: Partial<ChangeRequest>): Promise<ChangeRequest> {
    const { data } = await api.put<ChangeRequest>(`/changes/${id}`, updates)
    return data
  },
}
