import { api } from './api'
import type { Resource } from '../types'

export const resourceService = {
  async getResources(projectId: string): Promise<Resource[]> {
    const { data } = await api.get<Resource[]>(`/projects/${projectId}/resources`)
    return data
  },

  async createResource(resource: Omit<Resource, 'id'>): Promise<Resource> {
    const { data } = await api.post<Resource>(`/projects/${resource.projectId}/resources`, resource)
    return data
  },

  async updateResource(id: string, projectId: string, updates: Partial<Resource>): Promise<Resource> {
    const { data } = await api.put<Resource>(`/projects/${projectId}/resources/${id}`, updates)
    return data
  },

  async deleteResource(id: string): Promise<void> {
    await api.delete(`/resources/${id}`)
  },
}
