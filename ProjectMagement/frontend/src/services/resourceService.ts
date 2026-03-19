import { api, USE_MOCK } from './api'
import { mockResources } from '../mocks/data'
import type { Resource } from '../types'

export const resourceService = {
  async getResources(projectId: string): Promise<Resource[]> {
    if (USE_MOCK) return mockResources.filter((r) => r.projectId === projectId)
    const { data } = await api.get<Resource[]>(`/projects/${projectId}/resources`)
    return data
  },

  async createResource(resource: Omit<Resource, 'id'>): Promise<Resource> {
    if (USE_MOCK) {
      const newRes: Resource = { ...resource, id: 'res-' + Date.now() }
      mockResources.push(newRes)
      return newRes
    }
    const { data } = await api.post<Resource>(`/projects/${resource.projectId}/resources`, resource)
    return data
  },

  async updateResource(id: string, projectId: string, updates: Partial<Resource>): Promise<Resource> {
    if (USE_MOCK) {
      const r = mockResources.find((x) => x.id === id)
      if (!r) throw new Error('Not found')
      Object.assign(r, updates)
      return r
    }
    const { data } = await api.put<Resource>(`/projects/${projectId}/resources/${id}`, updates)
    return data
  },

  async deleteResource(id: string): Promise<void> {
    if (USE_MOCK) {
      const i = mockResources.findIndex((x) => x.id === id)
      if (i >= 0) mockResources.splice(i, 1)
      return
    }
    await api.delete(`/resources/${id}`)
  },
}
