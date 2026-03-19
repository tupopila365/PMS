import { api, USE_MOCK } from './api'
import { mockRACIEntries } from '../mocks/data'
import type { RACIEntry } from '../types'

export const raciService = {
  async getEntries(projectId: string): Promise<RACIEntry[]> {
    if (USE_MOCK) return mockRACIEntries.filter((r) => r.projectId === projectId)
    const { data } = await api.get<RACIEntry[]>(`/projects/${projectId}/raci`)
    return data
  },

  async saveEntry(entry: RACIEntry): Promise<RACIEntry> {
    if (USE_MOCK) {
      const i = mockRACIEntries.findIndex((r) => r.id === entry.id)
      if (i >= 0) mockRACIEntries[i] = entry
      else mockRACIEntries.push({ ...entry, id: 'raci-' + Date.now() })
      return entry
    }
    const { data } = await api.put<RACIEntry>(`/projects/${entry.projectId}/raci/${entry.id}`, entry)
    return data
  },
}
