import { api, USE_MOCK } from './api'
import { mockChangeRequests, mockProjects } from '../mocks/data'
import { auditService } from './auditService'
import type { ChangeRequest } from '../types'

export const changeService = {
  async getChanges(projectId?: string): Promise<ChangeRequest[]> {
    if (USE_MOCK) return projectId ? mockChangeRequests.filter((c) => c.projectId === projectId) : mockChangeRequests
    const params = projectId ? { projectId } : {}
    const { data } = await api.get<ChangeRequest[]>('/changes', { params })
    return data
  },

  async createChange(change: Omit<ChangeRequest, 'id'>): Promise<ChangeRequest> {
    if (USE_MOCK) {
      const newChange: ChangeRequest = { ...change, id: 'change-' + Date.now() }
      mockChangeRequests.push(newChange)
      const project = mockProjects.find((p) => p.id === change.projectId)
      auditService.log('change_requested', 'change', change.projectId, project?.name || 'Unknown', newChange.id)
      return newChange
    }
    const { data } = await api.post<ChangeRequest>('/changes', change)
    return data
  },

  async updateChange(id: string, updates: Partial<ChangeRequest>): Promise<ChangeRequest> {
    if (USE_MOCK) {
      const c = mockChangeRequests.find((x) => x.id === id)
      if (!c) throw new Error('Not found')
      Object.assign(c, updates)
      if (updates.status === 'approved') {
        const project = mockProjects.find((p) => p.id === c.projectId)
        auditService.log('change_approved', 'change', c.projectId, project?.name || 'Unknown', id)
      }
      if (updates.status === 'rejected') {
        auditService.log('change_rejected', 'change', c.projectId, mockProjects.find((p) => p.id === c.projectId)?.name || 'Unknown', id)
      }
      return c
    }
    const { data } = await api.put<ChangeRequest>(`/changes/${id}`, updates)
    return data
  },
}
