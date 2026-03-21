import { api } from './api'
import type { RACIEntry } from '../types'

export const raciService = {
  async getEntries(projectId: string): Promise<RACIEntry[]> {
    const { data } = await api.get<RACIEntry[]>(`/projects/${projectId}/raci`)
    return data
  },

  async saveEntry(entry: RACIEntry): Promise<RACIEntry> {
    const { data } = await api.put<RACIEntry>(`/projects/${entry.projectId}/raci/${entry.id}`, entry)
    return data
  },
}
