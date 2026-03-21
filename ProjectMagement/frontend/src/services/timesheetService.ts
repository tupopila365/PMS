import { api } from './api'
import type { TimesheetEntry } from '../types'

export const timesheetService = {
  async getEntries(projectId?: string, userId?: string): Promise<TimesheetEntry[]> {
    const params: Record<string, string> = {}
    if (projectId) params.projectId = projectId
    const { data } = await api.get<TimesheetEntry[]>('/timesheets', { params })
    let list = data
    if (userId) list = list.filter((e) => e.userId === userId)
    return list
  },

  async createEntry(entry: Omit<TimesheetEntry, 'id'>): Promise<TimesheetEntry> {
    const { data } = await api.post<TimesheetEntry>('/timesheets', entry)
    return data
  },

  async updateEntry(id: string, updates: Partial<TimesheetEntry>): Promise<TimesheetEntry> {
    const { data } = await api.put<TimesheetEntry>(`/timesheets/${id}`, updates)
    return data
  },

  async deleteEntry(id: string): Promise<void> {
    await api.delete(`/timesheets/${id}`)
  },
}
