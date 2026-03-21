import { api } from './api'
import type { RAIDItem } from '../types'

export const raidService = {
  async getItems(projectId: string): Promise<RAIDItem[]> {
    const { data } = await api.get<RAIDItem[]>(`/projects/${projectId}/raid`)
    return data
  },

  async createItem(item: Omit<RAIDItem, 'id'>): Promise<RAIDItem> {
    const { data } = await api.post<RAIDItem>(`/projects/${item.projectId}/raid`, item)
    return data
  },

  async updateItem(id: string, projectId: string, updates: Partial<RAIDItem>): Promise<RAIDItem> {
    const { data } = await api.put<RAIDItem>(`/projects/${projectId}/raid/${id}`, updates)
    return data
  },
}
