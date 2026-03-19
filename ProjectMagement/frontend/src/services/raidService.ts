import { api, USE_MOCK } from './api'
import { mockRAIDItems } from '../mocks/data'
import type { RAIDItem } from '../types'

export const raidService = {
  async getItems(projectId: string): Promise<RAIDItem[]> {
    if (USE_MOCK) return mockRAIDItems.filter((r) => r.projectId === projectId)
    const { data } = await api.get<RAIDItem[]>(`/projects/${projectId}/raid`)
    return data
  },

  async createItem(item: Omit<RAIDItem, 'id'>): Promise<RAIDItem> {
    if (USE_MOCK) {
      const newItem: RAIDItem = { ...item, id: 'raid-' + Date.now() }
      mockRAIDItems.push(newItem)
      return newItem
    }
    const { data } = await api.post<RAIDItem>(`/projects/${item.projectId}/raid`, item)
    return data
  },

  async updateItem(id: string, projectId: string, updates: Partial<RAIDItem>): Promise<RAIDItem> {
    if (USE_MOCK) {
      const r = mockRAIDItems.find((x) => x.id === id)
      if (!r) throw new Error('Not found')
      Object.assign(r, updates)
      return r
    }
    const { data } = await api.put<RAIDItem>(`/projects/${projectId}/raid/${id}`, updates)
    return data
  },
}
